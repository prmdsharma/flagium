#!/bin/bash

# Configuration
REMOTE_USER="ubuntu"
REMOTE_HOST="80.225.201.34"
SSH_KEY="~/ocip/ssh-key-2026-02-17.key"
REMOTE_DIR="~/flagium"
FE_DIST_DIR="ui/dist"

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

# 3. Sync Backend Files
echo "⬆️ Syncing Backend..."
rsync -avz --exclude '.env' --exclude 'node_modules' --exclude '__pycache__' \
      --exclude 'dist' --exclude 'venv' --exclude '.git' --exclude '.DS_Store' \
      -e "ssh -i $SSH_KEY" ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# 4. Sync Frontend Assets
echo "⬆️ Syncing Frontend Assets..."
rsync -avz --delete -e "ssh -i $SSH_KEY" $FE_DIST_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/ui/dist/

# 5. Restart Services on Remote
echo "🔄 Restarting Remote Services..."
ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST "pm2 restart flagium-backend"

echo "✅ Deployment Successful!"
