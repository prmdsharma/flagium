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

## 4. Production Deployment (Automated)

The project now includes a standardized deployment script that enforces safety rules (e.g., only deploying from the `main` branch).

### Automated Deployment Steps
1. Ensure you are on the `main` branch and all changes are pushed.
2. Run the deployment script from the project root:
   ```bash
   ./scripts/deploy.sh
   ```

The script will:
- Verify you are on the `main` branch.
- Build the frontend production bundle.
- Sync backend and frontend files to the production server.
- Restart the necessary services.

---

## 5. Manual Backup / Detailed Steps
If the script cannot be used, follow these manual steps:

### Backend Sync
```bash
rsync -avz --exclude '.env' --exclude 'node_modules' --exclude '__pycache__' --exclude 'dist' -e "ssh -i ~/ocip/ssh-key-2026-02-17.key" ./ ubuntu@80.225.201.34:~/flagium/
```

### Frontend Build & Sync
1. Navigate to the `ui` directory:
   ```bash
   cd ui && npm run build
   ```
2. Sync the `dist` folder:
   ```bash
   rsync -avz --delete -e "ssh -i ~/ocip/ssh-key-2026-02-17.key" dist/ ubuntu@80.225.201.34:~/flagium/ui/dist/
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
