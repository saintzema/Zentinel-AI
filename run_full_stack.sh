#!/bin/bash

# Zentinel Full Stack Launcher
# Runs both the landing page and the dashboard simultaneously

echo "🚀 Starting Zentinel Full Stack..."
echo ""

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
 I  I 
# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start landing page server
echo -e "${CYAN}📄 Starting Landing Page (port 8001)...${NC}"
cd landing
python3 -m http.server 8001 > /dev/null 2>&1 &
LANDING_PID=$!
cd ..

# Wait a moment
sleep 1

# Start frontend dashboard
echo -e "${CYAN}⚛️  Starting Dashboard (port 5173)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for servers to start
sleep 3

echo ""
echo -e "${GREEN}✅ Full Stack Running!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📱 Landing Page:  http://localhost:8001"
echo "  🖥️  Dashboard:     http://localhost:5173"
echo ""
echo "  👉 Start at: http://localhost:8001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for background processes
wait
