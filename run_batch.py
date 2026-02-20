import sys
import os

# Add root to path
sys.path.append(os.getcwd())

from ingestion.ingest import ingest_all

print("🚀 Starting ingestion batch (Limit: 10)...")
print("ℹ️  Note: Pre-2019 data will be skipped automatically.")

if __name__ == "__main__":
    # ingest_all defaults to Nifty Total Market (750) (full run)
    # If delta_mode is True, it processes only missing quarters/years.
    ingest_all(delta_mode=False)

print("\n✅ Batch complete.")
