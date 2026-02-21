import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_NAME = os.getenv("DB_NAME", "flagium")
DB_PORT = int(os.getenv("DB_PORT", 3306))

def migrate():
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    try:
        with connection.cursor() as cursor:
            # Check if columns exist
            cursor.execute("SHOW COLUMNS FROM users LIKE 'reset_token'")
            if not cursor.fetchone():
                print("Adding reset_token column...")
                cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL")
            
            cursor.execute("SHOW COLUMNS FROM users LIKE 'reset_token_expires'")
            if not cursor.fetchone():
                print("Adding reset_token_expires column...")
                cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL")
                
        connection.commit()
        print("Migration completed successfully.")
        
    except Exception as e:
        print(f"Error checking/adding columns: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()
