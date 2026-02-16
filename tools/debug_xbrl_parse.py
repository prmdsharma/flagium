import sys
import os
import json
import argparse

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingestion.xbrl_parser import parse_xbrl_file

def main():
    parser = argparse.ArgumentParser(description="Debug XBRL parsing for a specific file.")
    parser.add_argument("file", help="Path to the XBRL .xml file")
    
    args = parser.parse_args()
    file_path = args.file

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    print(f"📄 Parsing {file_path}...")
    try:
        records = parse_xbrl_file(file_path)
        
        print(f"\n✅ Extracted {len(records)} records:")
        print(json.dumps(records, indent=2, default=str))

        # Check specifically for Year/Quarter logic
        if records:
            print("\n📊 Summary Table:")
            print(f"{'Date':<15} | {'Year':<6} | {'Quarter':<8}")
            print("-" * 35)
            for r in records:
                print(f"{str(r['period_end']):<15} | {r['year']:<6} | {r['quarter']:<8}")
        else:
            print("⚠️  No records could be extracted from this file.")
            
    except Exception as e:
        print(f"❌ Error during parsing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
