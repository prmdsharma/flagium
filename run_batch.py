import sys
import os

# Add root to path
sys.path.append(os.getcwd())

from ingestion.ingest import ingest_all

print("🚀 Starting ingestion batch (Limit: 10)...")
print("ℹ️  Note: Pre-2019 data will be skipped automatically.")

# ingest_all defaults to Nifty 500 (full run)
results = ingest_all(limit=None)

print("\n✅ Batch complete.")
