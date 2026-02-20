#!/bin/bash

# Configuration
REMOTE_USER="ubuntu"
REMOTE_HOST="80.225.201.34"
SSH_KEY="~/ocip/ssh-key-2026-02-17.key"
REMOTE_DIR="~/flagium"
FE_DIST_DIR="ui/dist"
PM2_APP_NAME="flagium-api"
START_CMD="venv/bin/uvicorn api.server:app --host 0.0.0.0 --port 8000"

# 1. Enforce Main Branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Deployment is only allowed from the 'main' branch."
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

echo "🚀 Starting Production Deployment from 'main'..."

# 2. Build Frontend
echo "📦 Building Frontend..."
cd ui && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# 3. Patch Nginx Config (One-time or if changed)
echo "🔧 Checking/Patching Nginx Config..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "
    if ! grep -q 'X-Forwarded-Host' /etc/nginx/sites-enabled/flagium; then
        echo 'Patching Nginx config for better redirects...'
        sudo sed -i '/proxy_set_header Host \$host;/a \        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \$scheme;\n        proxy_set_header X-Forwarded-Host \$host;' /etc/nginx/sites-enabled/flagium
        sudo nginx -t && sudo systemctl reload nginx
    else
        echo 'Nginx config already patched.'
    fi
"

# 4. Sync Backend Files
echo "⬆️ Syncing Backend..."
rsync -avz --exclude '.env' --exclude 'node_modules' --exclude '__pycache__' \
      --exclude 'dist' --exclude 'venv' --exclude '.git' --exclude '.DS_Store' \
      -e "ssh -i $SSH_KEY" ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 4. Sync Frontend Assets
echo "⬆️ Syncing Frontend Assets..."
rsync -avz --delete -e "ssh -i $SSH_KEY" $FE_DIST_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/ui/dist/

# 5. Restart Services on Remote
echo "🔄 Restarting Remote Services..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "
    cd $REMOTE_DIR
    echo '--- PM2 Status Before ---'
    pm2 list
    echo '--- Restarting $PM2_APP_NAME ---'
    if pm2 describe $PM2_APP_NAME > /dev/null 2>&1; then
        pm2 restart $PM2_APP_NAME
        echo '✅ PM2 process restarted.'
    else
        echo '⚠️  Process not found in PM2, starting fresh...'
        pm2 start '$START_CMD' --name $PM2_APP_NAME
        pm2 save
        echo '✅ PM2 process started and saved.'
    fi
    sleep 2
    echo '--- PM2 Status After ---'
    pm2 list
    echo '--- API Connectivity Check ---'
    curl -s localhost:8000/api/ping || echo '⚠️ Local API check failed'
"

echo "✅ Deployment Successful!"
echo "💡 Please verify: https://flagiumai.com/api/ping"
