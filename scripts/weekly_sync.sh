#!/bin/bash
# Flagium weekly ingestion script
# Runs as cron on Sunday 00:00

PROJECT_DIR="/home/ubuntu/flagium"
VENV="$PROJECT_DIR/venv/bin/python"
LOG_FILE="$PROJECT_DIR/logs/weekly_ingest.log"

mkdir -p "$PROJECT_DIR/logs"

echo "[$(date)] Starting weekly delta ingestion..." >> "$LOG_FILE"

# Run ingestion in delta mode for the full equity list
cd "$PROJECT_DIR"
$VENV main.py ingest --delta >> "$LOG_FILE" 2>&1

echo "[$(date)] Weekly ingestion finished." >> "$LOG_FILE"
