import sys
import os

print(f"Executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
print("Path:")
for p in sys.path:
    print(f"  {p}")

try:
    import mysql.connector
    print("✅ mysql.connector found!")
    print(f"  File: {mysql.connector.__file__}")
except ImportError as e:
    print(f"❌ mysql.connector NOT found: {e}")

try:
    import db.connection
    print("✅ db.connection found!")
except ImportError as e:
    print(f"❌ db.connection NOT found: {e}")
