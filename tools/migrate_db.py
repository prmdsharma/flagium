
import mysql.connector

def migrate():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="flagium_user",
            password="TempPass123!",
            database="flagium"
        )
        cursor = conn.cursor()
        
        # Check if columns exist
        cursor.execute("DESCRIBE flags")
        columns = [row[0] for row in cursor.fetchall()]
        
        if "fiscal_year" not in columns:
            print("Adding fiscal_year column...")
            cursor.execute("ALTER TABLE flags ADD COLUMN fiscal_year INT")
            
        if "fiscal_quarter" not in columns:
            print("Adding fiscal_quarter column...")
            cursor.execute("ALTER TABLE flags ADD COLUMN fiscal_quarter INT DEFAULT 0")

        # Update Unique Index to include new columns
        # First drop existing index/constraint if needed. 
        # The bootstrap.sql didn't explicitly name a unique constraint for flags, 
        # but the new one should process (company_id, flag_code, fiscal_year, fiscal_quarter).
        # Let's add an index for faster lookups/deletes.
        print("Adding index...")
        try:
            cursor.execute("CREATE INDEX idx_flags_company_year_quarter ON flags(company_id, fiscal_year, fiscal_quarter)")
            print("Index created.")
        except mysql.connector.Error as err:
            print(f"Index might already exist or error: {err}")

        conn.commit()
        print("Migration successful.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
