
import mysql.connector

def verify():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="flagium_user",
            password="TempPass123!",
            database="flagium"
        )
        cursor = conn.cursor(dictionary=True)
        
        print("Checking recent flags...")
        cursor.execute("""
            SELECT f.flag_code, f.fiscal_year, f.fiscal_quarter, f.period_type, c.ticker 
            FROM flags f 
            JOIN companies c ON f.company_id = c.id 
            ORDER BY f.created_at DESC 
            LIMIT 10
        """)
        
        for row in cursor.fetchall():
            q_str = f"Q{row['fiscal_quarter']}" if row['fiscal_quarter'] > 0 else "Annual"
            print(f"- {row['ticker']}: {row['flag_code']} ({row['fiscal_year']} {q_str}) [{row['period_type']}]")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify()
