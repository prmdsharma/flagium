import mysql.connector
from db.connection import get_connection

def migrate():
    print("🚀 Starting Phase 2 Migration...")
    conn = get_connection()
    cursor = conn.cursor()

    # Users Table
    print("Creating 'users' table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Portfolios Table
    print("Creating 'portfolios' table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Portfolio Items Table
    print("Creating 'portfolio_items' table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portfolio_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        portfolio_id INT NOT NULL,
        company_id INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(portfolio_id, company_id),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Migration Complete.")

if __name__ == "__main__":
    migrate()
