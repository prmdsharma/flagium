# Flagium Production Deployment Guide

This guide outlines the steps to deploy Flagium to the production environment, including data migration and system configuration.

## 1. Prerequisites
- **Server**: Linux (Ubuntu 22.04+ recommended)
- **Database**: MySQL 8.0+
- **Runtimes**: Python 3.9+, Node.js 18+
- **Process Manager**: `pm2` (recommended for both frontend and backend)

## 2. Infrastructure Setup
### Backend Environment Variables
Create a `.env` file in the root directory (or set via system env):
```bash
DB_HOST=your-prod-db-host
DB_USER=flagium_user
DB_PASS=your-secure-password
DB_NAME=flagium
SECRET_KEY=generate-a-secure-secret-key
```

### Database Preparation
1. Create the `flagium` database on the production server.
2. Ensure the database user has sufficient privileges.

## 3. Data Migration (Dev to Prod)
To avoid re-ingesting 8 quarters of data for all companies, we migrate the state from the development box.

### Step 3.1: Export from Dev
On the development machine:
```bash
# Export schema and data (excluding logs if necessary)
mysqldump -u flagium_user -p flagium > flagium_dev_dump.sql
```

### Step 3.2: Import to Prod
Transfer the `flagium_dev_dump.sql` to the production server and run:
```bash
mysql -u flagium_user -p flagium < flagium_dev_dump.sql
```

## 4. Backend Deployment
1. Clone the repository and checkout the `main` or `release` branch.
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Start the API server using `pm2` or `systemd`:
   ```bash
   pm2 start "uvicorn api.server:app --host 0.0.0.0 --port 8000" --name flagium-backend
   ```

## 5. Frontend Deployment
1. Navigate to the `ui` directory:
   ```bash
   cd ui
   npm install
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Serve the `dist` folder using Nginx or Caddy. Alternatively, use `pm2 serve`:
   ```bash
   pm2 serve dist 5173 --name flagium-frontend --spa
   ```

## 6. Post-Deployment & Incremental Updates
### Initial Scan
After the database migration, ensure all historical flags are calculated:
```bash
# Optional: Run engine for all companies if not included in dump
python main.py --scan-all --backfill-quarters 8
```

### Incremental Updates (Cron Job)
Configure a daily/weekly cron job to fetch new data and trigger scans:
```bash
# Example cron: Run every Sunday at midnight
0 0 * * 0 cd /path/to/flagium && ./venv/bin/python main.py --ingest-recent --scan-recent
```

> [!IMPORTANT]
> Always verify the **Data Sanity** report in the Admin Console after any major data migration or ingestion run.
