#!/bin/sh
set -e

echo "Starting Go Backend Server on port 8000..."
cd /app
export PORT=8000
./backend_binary &

echo "Starting Next.js Frontend Server on port 3000..."
cd /app/frontend
export HOSTNAME="0.0.0.0"
export PORT=3000
node server.js
