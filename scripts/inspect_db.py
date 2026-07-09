import sqlite3
import os

db_path = os.environ.get("MORLEN_DB_PATH", "data/morlen.db")

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}. Please seed it first.")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row

print(" Morlen SQLite DB Inspector")

tables = ["businesses", "review_batches", "reviews", "painpoint_snapshots", "personas", "collision_logs", "recommendation_logs"]

for table in tables:
    try:
        cursor = conn.execute(f"SELECT COUNT(*) as count FROM {table}")
        count = cursor.fetchone()["count"]
        print(f"Table '{table}': {count} records")
        
        if count > 0:
            cursor = conn.execute(f"SELECT * FROM {table} LIMIT 1")
            row = cursor.fetchone()
            print("  [Sample Record]")
            for key in row.keys():
                val = str(row[key])[:50] + "..." if row[key] and len(str(row[key])) > 50 else str(row[key])
                print(f"    {key}: {val}")
    except sqlite3.OperationalError:
        print(f"Table '{table}': Does not exist")
    print("-" * 40)

conn.close()
