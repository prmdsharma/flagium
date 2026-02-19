import csv
import io

def get_val(row, keys, default=None):
    for k in row.keys():
        if not k: continue
        k_clean = k.strip().lower().replace("\"", "").replace("'", "")
        if k_clean in keys:
            return row[k]
    return default

def test_parser(file_path):
    TICKER_KEYS = ["ticker", "instrument", "symbol", "stock", "company", "name"]
    INVESTMENT_KEYS = ["investment", "invested", "amount", "total", "value", "cur. val"]
    QTY_KEYS = ["qty.", "qty", "quantity", "shares"]
    PRICE_KEYS = ["avg. cost", "avg cost", "average price", "cost price", "buy price", "ltp"]

    with open(file_path, "r", encoding="utf-8-sig") as f:
        content = f.read()
        
    lines = [line.strip() for line in content.split("\n") if line.strip()]
    
    header_index = 0
    common_fields = {"ticker", "instrument", "symbol", "stock", "qty", "quantity", "invested", "amount"}
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(field in line_lower for field in common_fields):
            header_index = i
            break
            
    header_line = lines[header_index]
    data_lines = lines[header_index+1:]
    
    reader = csv.DictReader(io.StringIO("\n".join([header_line] + data_lines)))
    
    results = []
    for row in reader:
        ticker_raw = get_val(row, TICKER_KEYS)
        if not ticker_raw: continue
        
        investment_raw = get_val(row, INVESTMENT_KEYS)
        investment = None
        if investment_raw:
            try:
                investment = float(str(investment_raw).replace("₹", "").replace(",", "").replace("$", "").strip())
            except:
                pass
                
        if investment is None or investment <= 0:
            qty_raw = get_val(row, QTY_KEYS)
            price_raw = get_val(row, PRICE_KEYS)
            if qty_raw and price_raw:
                try:
                    qty = float(str(qty_raw).replace(",", "").strip())
                    price = float(str(price_raw).replace(",", "").strip())
                    investment = qty * price
                except:
                    pass
        
        ticker = str(ticker_raw).strip().upper().split(".")[0]
        results.append({"ticker": ticker, "investment": investment})
        
    return results

if __name__ == "__main__":
    file_path = "holdings.csv"
    parsed = test_parser(file_path)
    print(f"Parsed {len(parsed)} items from {file_path}")
    for item in parsed[:5]:
        print(f"  {item['ticker']}: {item['investment']}")
    # Verify specific items
    expected_abc = 184712.85
    abc_found = next((x for x in parsed if x["ticker"] == "ABCAPITAL"), None)
    if abc_found and abs(abc_found["investment"] - expected_abc) < 0.01:
        print("✅ ABCAPITAL (Invested) verified successfully.")
    else:
        print(f"❌ ABCAPITAL verification failed. Found: {abc_found}")

    expected_anant = 2863.6
    anant_found = next((x for x in parsed if x["ticker"] == "ANANTRAJ"), None)
    if anant_found and abs(anant_found["investment"] - expected_anant) < 0.01:
        print("✅ ANANTRAJ (Invested) verified successfully.")
    else:
        print(f"❌ ANANTRAJ verification failed. Found: {anant_found}")
