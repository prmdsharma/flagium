from ingestion.xbrl_parser import parse_xbrl_file
import json
import os

# Specific file that was downloaded during ingestion for NUVOCO Annual
file_path = "data/xbrl/NUVOCO_31-Mar-2024_a46883.xml"

if not os.path.exists(file_path):
    print(f"❌ File not found: {file_path}")
    print("Please run ingestion first or check the path.")
else:
    print(f"📄 Parsing {file_path}...")
    records = parse_xbrl_file(file_path)
    
    print(f"\n✅ Extracted {len(records)} records:")
    print(json.dumps(records, indent=2, default=str))

    # Check specifically for Year/Quarter logic
    for r in records:
        print(f"➡ Date: {r['period_end']} | Year: {r['year']} | Quarter: {r['quarter']}")
