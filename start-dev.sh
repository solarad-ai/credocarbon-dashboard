#!/bin/bash

echo "Starting CredoCarbon Development Environment..."

# Backend
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd \"$(pwd)\" && source venv/bin/activate && uvicorn apps.api.main:app --reload --port 8000"
end tell
EOF

# Frontend
osascript <<EOF
tell application "Terminal"
  activate
  do script "cd \"$(pwd)/apps/web\" && npm run dev"
end tell
EOF

echo "Services started!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
