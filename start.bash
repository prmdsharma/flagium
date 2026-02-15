#!/bin/bash

# Trap SIGINT (Ctrl+C) to kill background processes
trap "kill 0" SIGINT

echo "🚀 Starting Flagium..."

# Start Backend
echo "Backend: Starting FastAPI on port 8000..."
source venv/bin/activate
uvicorn api.server:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Frontend: Starting Vite on port 5173..."
cd ui
npm run dev -- --host &
FRONTEND_PID=$!

# Wait for processes
wait
