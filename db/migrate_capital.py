import mysql.connector
from db.connection import get_connection

def migrate():
    print("🚀 Adding 'investment' column to 'portfolio_items'...")
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM portfolio_items LIKE 'investment'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE portfolio_items ADD COLUMN investment BIGINT DEFAULT 100000")
            print("✅ 'investment' column added.")
        else:
            print("ℹ️ 'investment' column already exists.")
        
        conn.commit()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()
