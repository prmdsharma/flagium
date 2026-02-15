import requests
import pandas as pd
from lxml import etree
from io import BytesIO
from datetime import datetime

# ---------------------------
# CONFIG
# ---------------------------
# Map ticker to BSE/NSE company code
ticker_to_bsecode = {
    "RELIANCE": "500325",
    "TCS": "532540",
    # Add more tickers as needed
}

# XBRL tag mapping (standard / common)
xbrl_tags = {
    "Revenue": ["TotalRevenue", "RevenueFromOperations"],
    "NetProfit": ["ProfitLossAfterTax"],
    "OperatingCashFlow": ["NetCashProvidedByUsedInOperatingActivities"]
}

# Output DataFrame
df = pd.DataFrame(columns=["ticker","year","quarter","revenue","net_profit","operating_cash_flow"])

# ---------------------------
# FUNCTION TO PARSE XBRL XML
# ---------------------------
def parse_xbrl(content, ticker):
    tree = etree.parse(BytesIO(content))
    ns = {'xbrli': 'http://www.xbrl.org/2003/instance'}

    # Get context dates
    contexts = {}
    for context in tree.xpath('//xbrli:context', namespaces=ns):
        context_id = context.attrib['id']
        period = context.find('.//xbrli:period', namespaces=ns)
        if period.find('xbrli:instant', namespaces=ns) is not None:
            date = period.find('xbrli:instant', namespaces=ns).text
        elif period.find('xbrli:startDate', namespaces=ns) is not None:
            start = period.find('xbrli:startDate', namespaces=ns).text
            end = period.find('xbrli:endDate', namespaces=ns).text
            date = end
        else:
            date = None
        contexts[context_id] = date

    # Extract relevant numbers
    row_list = []
    for key, tags in xbrl_tags.items():
        for tag in tags:
            nodes = tree.xpath(f'//*[local-name()="{tag}"]')
            for node in nodes:
                context_ref = node.attrib.get('contextRef')
                date = contexts.get(context_ref)
                value = node.text
                if date and value:
                    # Determine quarter & year
                    try:
                        dt = datetime.strptime(date, "%Y-%m-%d")
                        quarter = (dt.month-1)//3 + 1
                        row = {
                            "ticker": ticker,
                            "year": dt.year,
                            "quarter": quarter
                        }
                        if key == "Revenue":
                            row["revenue"] = float(value)
                        elif key == "NetProfit":
                            row["net_profit"] = float(value)
                        elif key == "OperatingCashFlow":
                            row["operating_cash_flow"] = float(value)
                        row_list.append(row)
                    except:
                        continue
    return row_list

# ---------------------------
# DOWNLOAD AND PARSE FOR ALL TICKERS
# ---------------------------
for ticker, code in ticker_to_bsecode.items():
    # NSE XBRL URL (adjust if needed)
    url = f"https://www.bseindia.com/xml-data/corpfiling/{code}.xml"

    try:
        resp = requests.get(url)
        resp.raise_for_status()
        rows = parse_xbrl(resp.content, ticker)
        for r in rows:
            df = pd.concat([df, pd.DataFrame([r])], ignore_index=True)
        print(f"Processed {ticker}")
    except Exception as e:
        print(f"Failed {ticker}: {e}")

# ---------------------------
# CLEAN & PIVOT
# ---------------------------
# Fill missing columns with 0
for col in ["revenue","net_profit","operating_cash_flow"]:
    if col not in df.columns:
        df[col] = 0
df_final = df.groupby(["ticker","year","quarter"], as_index=False).agg({
    "revenue":"sum",
    "net_profit":"sum",
    "operating_cash_flow":"sum"
})

# ---------------------------
# EXPORT CSV / Excel for Google Sheets
# ---------------------------
df_final.to_csv("financials_google_sheets.csv", index=False)
df_final.to_excel("financials_google_sheets.xlsx", index=False)

print("Done! CSV and Excel ready for Google Sheets")
