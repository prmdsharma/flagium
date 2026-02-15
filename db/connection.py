import mysql.connector
from mysql.connector import Error


def get_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="flagium_user",
            password="TempPass123!",
            database="flagium"
        )

        if connection.is_connected():
            return connection

    except Error as e:
        print("❌ Error while connecting to MySQL:", e)
        raise
