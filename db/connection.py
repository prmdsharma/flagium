import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "flagium_user"),
            password=os.getenv("DB_PASS"),
            database=os.getenv("DB_NAME", "flagium")
        )

        if connection.is_connected():
            return connection

    except Error as e:
        print("❌ Error while connecting to MySQL:", e)
        raise
