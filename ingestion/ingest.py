"""
Flagium — Ingestion Orchestrator

Coordinates the full data ingestion pipeline:
1. Initialize NSE session (with BSE fallback)
2. Fetch company info + financial filings list
3. Download XBRL files
4. Parse XBRL into structured data
5. Save to MySQL database
6. Handle revisions & corrections
"""

import os
import sys

import random
import time
import threading
from ingestion.nse_fetcher import (
    NSESession, get_company_info, get_financial_results,
    download_xbrl_file, fetch_nifty50_tickers, fetch_nifty500_tickers
)

# ... (omitted lines)



from ingestion.bse_fetcher import (
    BSESession, get_bse_scrip_code, get_financial_results_bse,
    download_xbrl_from_bse, scrape_announcement_feed
)
from ingestion.xbrl_parser import parse_xbrl_file, parse_xbrl_content
from ingestion.db_writer import save_financials, ensure_company
from db.connection import get_connection
from db.utils import update_job_status


# Directory to store downloaded XBRL files
XBRL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "xbrl")

# Memory Safety: Limit concurrent XBRL parsing (very memory intensive)
# Especially for the 1GB production server.
PARSE_SEMAPHORE = threading.Semaphore(2)


def ingest_company(session, conn, ticker, download_dir=None, keep_files=False, delta_mode=False):
    """Ingest financial data for a single company.

    Pipeline:
        1. Fetch company info from NSE
        2. Fetch financial results listing
        3. Download XBRL files
        4. Parse XBRL
        5. Save to database
        6. Cleanup XBRL files (optional)

    Args:
        session: Active NSESession.
        conn: Active MySQL connection.
        ticker: Stock ticker.
        download_dir: Directory to save XBRL files. Defaults to data/xbrl/.
        keep_files: If True, do not delete XBRL files after ingestion.

    Returns:
        dict with ingestion results.
    """
    if download_dir is None:
        download_dir = XBRL_DIR

    os.makedirs(download_dir, exist_ok=True)

    result = {
        "ticker": ticker,
        "status": "pending",
        "company_info": None,
        "filings_found": 0,
        "xbrl_downloaded": 0,
        "records_parsed": 0,
        "db_result": None,
    }

    # Step 1: Fetch company info + financial filings
    print(f"\n{'─' * 50}")
    print(f"📊 Processing {ticker}")
    print(f"{'─' * 50}")

    company_info = None
    filings = []

    # Try NSE first
    if session.is_available:
        company_info = get_company_info(session, ticker)
        if company_info:
            print(f"  ✅ Company (NSE): {company_info.get('name', ticker)}")

        for period in ["Annual", "Quarterly"]:
            new_filings = get_financial_results(session, ticker, period=period)
            if new_filings:
                # Filter for consolidated only
                cons_filings = [f for f in new_filings if _is_consolidated(f)]
                if cons_filings:
                    print(f"  📄 Found {len(cons_filings)} consolidated {period.lower()} filing(s) from NSE")
                    filings.extend(cons_filings)
                else:
                    print(f"  ⏭️  Skipping {len(new_filings)} standalone {period.lower()} filing(s) from NSE")

    # BSE fallback (or primary when NSE is blocked)
    if not filings:
        bse_code = get_bse_scrip_code(ticker)
        if bse_code:
            print(f"  🔄 Trying BSE (scrip: {bse_code})...")
            bse_session = BSESession()

            try:
                # Get company info from BSE if NSE didn't provide it
                if not company_info:
                    company_info = {"name": ticker, "ticker": ticker}

                # Check BSE for financial results
                bse_filings_raw = get_financial_results_bse(bse_session, bse_code)
                if bse_filings_raw:
                    # Filter for consolidated only
                    bse_filings = [f for f in bse_filings_raw if _is_consolidated(f)]
                    if bse_filings:
                        filings = bse_filings
                        print(f"  📄 Found {len(filings)} consolidated filing(s) from BSE")
                    else:
                        print(f"  ⏭️  Skipping {len(bse_filings_raw)} standalone filing(s) from BSE")
                else:
                    # Try direct XBRL download from BSE
                    xbrl_path = os.path.join(download_dir, f"{ticker}_bse_latest.xml")
                    if download_xbrl_from_bse(bse_session, bse_code, xbrl_path):
                        print(f"  ⬇️  Downloaded XBRL from BSE")
                        records = parse_xbrl_file(xbrl_path)
                        if records:
                            deduped = _deduplicate_records(records)
                            result["xbrl_downloaded"] = 1
                            result["records_parsed"] = len(records)
                            db_result = save_financials(conn, ticker, deduped, company_info)
                            result["db_result"] = db_result
                            result["status"] = "success" if not db_result["errors"] else "partial"
                            print(f"  💾 DB: {db_result['inserted']} inserted, {db_result['updated']} updated")
                            return result

                # Check for revisions in BSE announcements
                try:
                    announcements = scrape_announcement_feed(bse_session, [bse_code])
                    revisions = [a for a in announcements if a.get("is_revision")]
                    if revisions:
                        print(f"  🔄 Found {len(revisions)} revision(s) in BSE announcements")
                except Exception:
                    pass  # Announcement scraping is best-effort
            finally:
                bse_session.close()
        else:
            print(f"  ⚠️  No BSE scrip code mapped for {ticker}")

    if not company_info:
        company_info = {"name": ticker, "ticker": ticker}

    result["company_info"] = company_info
    result["filings_found"] = len(filings)

    if not filings:
        print(f"  ⚠️  No filings found on NSE or BSE for {ticker}")
        result["status"] = "no_filings"
        return result

    # Step 2: Delta Checkout (Skip existing data)
    latest_db = None
    if delta_mode:
        latest_db = _get_latest_db_period(conn, ticker)
        if latest_db:
            print(f"  📅 Delta Mode: Latest in DB is FY{latest_db['year']} Q{latest_db['quarter']}")
            
            initial_count = len(filings)
            filings = [f for f in filings if _is_filing_new(f, latest_db)]
            skipped = initial_count - len(filings)
            if skipped > 0:
                print(f"  ⏭️  Skipped {skipped} old filing(s) already in DB")
            
            if not filings:
                print(f"  ✅ Ticker {ticker} is already up-to-date")
                result["status"] = "success"
                return result

    import hashlib
    
    # Step 3: Download XBRL files
    all_records = []
    for filing in filings:
        xbrl_link = _extract_xbrl_link(filing)
        if not xbrl_link:
            continue

        period_str = _extract_period(filing)
        
        # Add hash to filename to prevent collisions between Standalone/Consolidated
        link_hash = hashlib.md5(xbrl_link.encode("utf-8")).hexdigest()[:6]
        filename = f"{ticker}_{period_str}_{link_hash}.xml"
        save_path = os.path.join(download_dir, filename)

        # Skip pre-2019 filings (old XBRL format, unparseable)
        try:
            filing_year = int(period_str.split("-")[-1])
            if filing_year < 2019:
                continue
        except (ValueError, IndexError):
            pass  # If can't determine year, try anyway

        # Skip if already downloaded
        if os.path.exists(save_path):
            print(f"  📁 Using cached: {filename}")
        else:
            print(f"  ⬇️  Downloading: {filename}")
            if not download_xbrl_file(session, xbrl_link, save_path):
                print(f"  ❌ Failed to download {filename}")
                # The user's provided snippet seems to indicate a cleanup here,
                # but the original code does not have it.
                # Assuming the intent was to comment out a potential cleanup
                # that might have been here or was intended to be here.
                # Cleanup: Delete the XML file after success
                # os.remove(xml_path)
                # print(f"✨ Cleaned up: {os.path.basename(xml_path)}")
                pass # This pass is from the user's snippet, keeping it.
                continue

        result["xbrl_downloaded"] += 1

        # Step 4: Parse XBRL (with memory guard)
        with PARSE_SEMAPHORE:
            records = parse_xbrl_file(save_path)
            if records:
                # Detect consolidation status from filing metadata
                is_cons = False
                cons_field = str(filing.get("consolidated", "")).lower()
                if "consolidated" in cons_field and "non" not in cons_field:
                    is_cons = True
                
                for r in records:
                    r["is_consolidated"] = is_cons
                    
                all_records.extend(records)
                print(f"  📊 Parsed {len(records)} record(s) from {filename} (Consolidated: {is_cons})")

    result["records_parsed"] = len(all_records)

    if not all_records:
        print(f"  ⚠️  No financial records parsed for {ticker}")
        result["status"] = "no_records"
        return result

    # Deduplicate by year (keep most recent)
    deduped = _deduplicate_records(all_records)
    print(f"  📊 {len(deduped)} unique year(s) of data")

    # Step 5: Save to database
    db_result = save_financials(conn, ticker, deduped, company_info)
    result["db_result"] = db_result
    result["status"] = "success" if not db_result["errors"] else "partial"

    inserted = db_result["inserted"]
    updated = db_result["updated"]
    errors = len(db_result["errors"])
    print(f"  💾 DB: {inserted} inserted, {updated} updated, {errors} errors")

    if db_result["errors"]:
        for err in db_result["errors"]:
            print(f"  ❌ {err}")

    # Step 6: Cleanup XBRL files
    if not keep_files and result["status"] in ("success", "partial"):
        import hashlib
        for filing in filings:
            xbrl_link = _extract_xbrl_link(filing)
            if not xbrl_link:
                continue
            period_str = _extract_period(filing)
            link_hash = hashlib.md5(xbrl_link.encode("utf-8")).hexdigest()[:6]
            filename = f"{ticker}_{period_str}_{link_hash}.xml"
            save_path = os.path.join(download_dir, filename)
            if os.path.exists(save_path):
                try:
                    os.remove(save_path)
                except Exception as e:
                    print(f"  ⚠️  Failed to cleanup {filename}: {e}")
        print(f"  ✨ Cleaned up {len(filings)} XBRL file(s)")
    _backfill_annual_pbt(conn, ticker)

    return result


def _is_consolidated(filing):
    """Determine if a filing is consolidated based on metadata.
    
    Checks NSE's 'consolidated' field and BSE's 'NEWSSUB' field.
    Excludes anything containing 'standalone' or 'not consolidated'.
    """
    # NSE Logic
    cons_field = str(filing.get("consolidated", "")).lower()
    if cons_field:
        if "consolidated" in cons_field and "non" not in cons_field and "not" not in cons_field:
            return True
        return False
        
    # BSE Logic (NEWSSUB usually contains 'Consolidated' or 'Standalone')
    news_sub = str(filing.get("NEWSSUB", "")).lower()
    if news_sub:
        if "consolidated" in news_sub and "standalone" not in news_sub:
            return True
        return False
        
    # Fallback: if we can't tell, assume False to be safe (we only want consolidated)
    return False


def ingest_all(tickers=None, limit=None, offset=0, keep_files=False, delta_mode=False):
    """Ingest financial data for multiple companies.

    Args:
        tickers: List of tickers. Defaults to Nifty 500.
        limit: Max companies to process.
        offset: Number of companies to skip.
        keep_files: If True, do not delete XBRL files after ingestion.
        delta_mode: If True, only fetch data newer than what's in the DB.

    Returns:
        List of result dicts (one per company).
    """
    if tickers is None:
        # Default to Nifty 500
        tickers = fetch_nifty500_tickers()
        if not tickers:
            print("  ⚠️  Nifty 500 fetch failed, falling back to Nifty 50.")
            tickers = fetch_nifty50_tickers()

    if offset:
        print(f"  ⏩ Skipping first {offset} companies.")
        tickers = tickers[offset:]

    if limit:
        print(f"  🛑 Limiting ingestion to {limit} companies.")
        tickers = tickers[:limit]

    print(f"\n{'═' * 60}")
    print(f"  🚀 Flagium Data Ingestion")
    print(f"  Companies: {len(tickers)}")
    print(f"{'═' * 60}")

    update_job_status("Ingestion Job", "running", f"Starting ingestion for {len(tickers)} companies")

    session = NSESession()
    conn = get_connection()
    results = []

    try:
        for i, ticker in enumerate(tickers, 1):
            # Progress update in terminal
            print(f"\n[{i}/{len(tickers)}] ", end="")
            
            # Rate limiting / Jitter (0.5s to 2.0s) to avoid IP blocking
            if i > 1:
                delay = random.uniform(0.5, 2.0)
                time.sleep(delay)

            try:
                result = ingest_company(session, conn, ticker, keep_files=keep_files, delta_mode=delta_mode)
                results.append(result)
            except Exception as e:
                print(f"\n❌ Fatal error for {ticker}: {e}")
                results.append({
                    "ticker": ticker,
                    "status": "error",
                    "error": str(e),
                })
            
            # Periodically update job status with progress message
            if i % 10 == 0 or i == len(tickers):
                progress = int((i / len(tickers)) * 100)
                update_job_status("Ingestion Job", "running", f"Ingestion {progress}% complete ({i}/{len(tickers)} companies)")

        success_count = sum(1 for r in results if r.get("status") == "success")
        update_job_status("Ingestion Job", "completed", f"Processed {len(tickers)} companies. Success: {success_count}")

    except Exception as e:
        update_job_status("Ingestion Job", "failed", str(e))
        raise e
    finally:
        session.close()
        conn.close()

    # Print summary
    _print_summary(results)
    return results


def ingest_from_xbrl_file(file_path, ticker):
    """Ingest data from a local XBRL file (no NSE download needed).

    Useful for manually downloaded XBRL files.

    Args:
        file_path: Path to the XBRL XML file.
        ticker: Stock ticker for the company.

    Returns:
        Result dict.
    """
    print(f"\n📂 Ingesting from local file: {file_path}")
    print(f"   Ticker: {ticker}")

    records = parse_xbrl_file(file_path)
    if not records:
        print("❌ No records parsed from file")
        return {"ticker": ticker, "status": "no_records"}

    deduped = _deduplicate_records(records)
    print(f"  📊 Parsed {len(deduped)} record(s)")

    conn = get_connection()
    try:
        db_result = save_financials(conn, ticker, deduped)
        print(f"  💾 DB: {db_result['inserted']} inserted, "
              f"{db_result['updated']} updated")
        return {"ticker": ticker, "status": "success", "db_result": db_result}
    finally:
        conn.close()


# ──────────────────────────────────────────────
# Internal Helpers
# ──────────────────────────────────────────────

def _extract_xbrl_link(filing):
    """Extract XBRL download link from a filing record.

    NSE filing records may have different structures, so
    we check multiple possible field names.
    """
    # Common field names for XBRL link in NSE API responses
    for key in ["xbrl", "xbrlLink", "xbrl_link", "filingLink", "xbrlFile"]:
        link = filing.get(key)
        if link and isinstance(link, str) and link.strip():
            return link.strip()

    # Sometimes it's nested
    if isinstance(filing, dict):
        for key, value in filing.items():
            if isinstance(value, str) and "xbrl" in key.lower():
                return value
            if isinstance(value, str) and value.endswith(".xml"):
                return value

    return None


def _extract_period(filing):
    """Extract period string from a filing for filename purposes."""
    for key in ["financialResultEnded", "toDate", "period", "periodEnded", "to_date"]:
        val = filing.get(key)
        if val:
            return str(val).replace("/", "-").replace(" ", "_")
    return "unknown"


def _get_latest_db_period(conn, ticker):
    """Retrieve the latest year and quarter currently stored in DB for a ticker."""
    cursor = conn.cursor()
    # Note: Annual reports have quarter=0, so (2024, 0) > (2023, 4)
    # We order by year DESC, then quarter DESC
    query = """
        SELECT f.year, f.quarter 
        FROM financials f
        JOIN companies c ON c.id = f.company_id
        WHERE c.ticker = %s
        ORDER BY f.year DESC, f.quarter DESC
        LIMIT 1
    """
    try:
        cursor.execute(query, (ticker,))
        row = cursor.fetchone()
        if row:
            return {"year": row[0], "quarter": row[1] or 0}
    except Exception as e:
        print(f"  ⚠️ DB Check error for {ticker}: {e}")
    finally:
        cursor.close()
    return None


def _is_filing_new(filing, latest_db):
    """Boolean check if filing is newer than what we have in DB."""
    if not latest_db:
        return True
        
    period_str = _extract_period(filing)
    if period_str == "unknown":
        return True
        
    # Standard format is "31-Mar-2024" or "31-Dec-2023"
    try:
        parts = period_str.split("-")
        if len(parts) >= 3:
            day, month_str, year_str = parts[0], parts[1], parts[2]
            f_year = int(year_str)
            
            # Map month to quarter
            # Mar -> Q4 or Annual (0), Jun -> Q1, Sep -> Q2, Dec -> Q3
            month_map = {
                "Jan": 4, "Feb": 4, "Mar": 4, # Usually Q4/Annual
                "Apr": 1, "May": 1, "Jun": 1,
                "Jul": 2, "Aug": 2, "Sep": 2,
                "Oct": 3, "Nov": 3, "Dec": 3
            }
            f_quarter = month_map.get(month_str[:3].capitalize(), 0)
            
            # Some filings are explicit about being Annual
            is_annual = "annual" in str(filing.get("period", "")).lower()
            if is_annual:
                f_quarter = 0 # Annual is 0 in our schema
            
            # Compare
            if f_year > latest_db["year"]:
                return True
            if f_year == latest_db["year"]:
                # If DB has Q4(4) and filing is Annual(0), we consider Annual(0) as newer/same but worth getting
                # Correct logic: if DB has (year, quarter), and filing is (year, f_quarter)
                # Annual (0) is special. Usually it's the final version of Q4.
                if f_quarter == 0 and latest_db["quarter"] > 0:
                    return True # Upgrade Q data to Annual
                return f_quarter > latest_db["quarter"]
    except Exception:
        return True # On parse error, assume it's new
        
    return False


def _deduplicate_records(records):
    """Deduplicate records by year, keeping the most complete record."""
    by_period = {}
    for record in records:
        year = record.get("year")
        quarter = record.get("quarter", 0)
        
        if year is None:
            continue

        key = (year, quarter)
        if key not in by_period:
            by_period[key] = record
        else:
            # Keep the record with more non-None fields
            existing = by_period[key]
            existing_count = sum(1 for v in existing.values() if v is not None)
            new_count = sum(1 for v in record.values() if v is not None)
            if new_count > existing_count:
                by_period[key] = record

    return list(by_period.values())


def _backfill_annual_pbt(conn, ticker):
    """Backfill Annual profit_before_tax from Q4 records.

    Annual XBRL files sometimes lack PBT tags, but Q4 records
    (which are YTD = full year) contain PBT. This copies PBT
    from Q4 to the corresponding Annual record when missing.
    """
    cursor = conn.cursor()
    sql = """
        UPDATE financials a
        JOIN financials q ON a.company_id = q.company_id AND a.year = q.year
        SET a.profit_before_tax = q.profit_before_tax
        WHERE a.quarter = 0 AND q.quarter = 4
        AND a.profit_before_tax IS NULL AND q.profit_before_tax IS NOT NULL
        AND a.company_id = (SELECT id FROM companies WHERE ticker = %s LIMIT 1)
    """
    cursor.execute(sql, (ticker,))
    if cursor.rowcount > 0:
        print(f"  🔄 Backfilled PBT for {cursor.rowcount} annual record(s) from Q4")
    conn.commit()
    cursor.close()


def _print_summary(results):
    """Print ingestion summary."""
    print(f"\n{'═' * 60}")
    print(f"  📋 Ingestion Summary")
    print(f"{'═' * 60}")

    success = sum(1 for r in results if r.get("status") == "success")
    partial = sum(1 for r in results if r.get("status") == "partial")
    failed = sum(1 for r in results if r.get("status") in ("error", "no_filings", "no_records"))
    total_records = sum(r.get("records_parsed", 0) for r in results)

    print(f"  ✅ Successful: {success}")
    if partial:
        print(f"  ⚠️  Partial:    {partial}")
    if failed:
        print(f"  ❌ Failed:      {failed}")
    print(f"  📊 Total records: {total_records}")
    print(f"{'═' * 60}\n")
