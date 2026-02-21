import json
import os
import sys

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_connection

def seed_flag_definitions():
    print("Starting flag_definitions migration and seed...")
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Step 1: Drop the existing unused table
        cursor.execute("DROP TABLE IF EXISTS flag_definitions")
        
        # Step 2: Create the new robust table with JSON params
        create_table_sql = """
        CREATE TABLE flag_definitions (
            flag_code VARCHAR(50) PRIMARY KEY,
            flag_name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            impact_weight INT NOT NULL DEFAULT 5,
            description TEXT,
            params JSON,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        """
        cursor.execute(create_table_sql)
        print("Created new flag_definitions schema.")

        # Step 3: Seed the 5 existing flags
        flags_data = [
            (
                "F1", "OCF < PAT", "Earnings Quality", 4, 
                "Operating Cash Flow is less than Net Profit, indicating potential earnings quality issues.",
                json.dumps({"lookback": 3, "threshold_count": 2})
            ),
            (
                "F2", "Negative FCF Streak", "Governance", 4, 
                "Free Cash Flow is negative for three consecutive years.",
                json.dumps({"streak_years": 3})
            ),
            (
                "F3", "Revenue-Debt Divergence", "Balance Sheet Stress", 5, 
                "Revenue is falling while total debt is rising year-over-year.",
                json.dumps({}) 
            ),
            (
                "F4", "Low Interest Coverage", "Balance Sheet Stress", 5, 
                "EBIT / Interest Expense ratio is critically low.",
                json.dumps({"high_severity_threshold": 1.5, "medium_severity_threshold": 2.5})
            ),
            (
                "F5", "Profit Collapse", "Earnings Quality", 5, 
                "Net Profit has dropped by more than 50% year-over-year.",
                json.dumps({"drop_threshold": 0.5})
            )
        ]

        insert_sql = """
        INSERT INTO flag_definitions (
            flag_code, flag_name, category, impact_weight, description, params
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        cursor.executemany(insert_sql, flags_data)
        conn.commit()
        print(f"Successfully seeded {cursor.rowcount} flag definitions.")

    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_flag_definitions()
