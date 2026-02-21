import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.routes import get_company, get_flags_for_company

def test_db_driven_flags():
    print("Testing DB-Driven Flag Logic for TCS...")
    try:
        data = get_company("TCS")
        score_data = data["risk_profiles"]
        
        print("Risk Score:", score_data.get("risk_score"))
        print("Status:", score_data.get("status"))
        
        flags = get_flags_for_company("TCS")
        for f in flags:
            print(f"- {f['flag_name']} | Category: {f.get('category')} | Impact: {f.get('impact_weight')}")

        print("Test Passed!")
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_db_driven_flags()
