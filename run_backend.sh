#!/bin/bash
echo "ZENTINEL Backend INITIATED"

# 1. Create Virtual Environment if not exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment (venv)..."
    python3 -m venv venv
fi

# 2. Activate Venv
source venv/bin/activate

echo "Starting Backend..."


uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
