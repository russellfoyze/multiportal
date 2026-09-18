#!/usr/bin/env bash

# ====================================================================
#   MA HOSSAIN - Private Document Portal & Vault Launcher (Mac/Linux)
# ====================================================================

set -e

# Change directory to script directory
cd "$(dirname "$0")"

echo "===================================================================="
echo "  MA HOSSAIN - Private Document Portal & Vault Launcher"
echo "===================================================================="
echo ""

# 1. Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed on this machine!"
    echo "Please install Node.js (v18+) from: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js found: $(node -v)"

# 2. Check if .env.local exists
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "[SETUP] Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo "[OK] .env.local created."
    fi
fi

# 3. Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "===================================================================="
    echo "  First Time Setup: Installing Dependencies (npm install)..."
    echo "===================================================================="
    npm install
fi

# 4. Start Next.js server
echo ""
echo "===================================================================="
echo "  Starting Portal Server on http://localhost:3000 ..."
echo "===================================================================="
echo ""

# Open browser if possible
if command -v xdg-open &> /dev/null; then
    (sleep 3 && xdg-open http://localhost:3000) &
elif command -v open &> /dev/null; then
    (sleep 3 && open http://localhost:3000) &
fi

npm run dev
