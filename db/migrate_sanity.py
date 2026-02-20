from db.connection import get_connection

def migrate():
    conn = get_connection()
    cursor = conn.cursor()
    print("Creating system_reports table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_type VARCHAR(50) NOT NULL UNIQUE,
            report_date DATE NOT NULL,
            report_data JSON NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    print("Done!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
