#!/bin/bash

echo "⚡ FLEETRAX QUICK CLEANUP"
echo "========================"
echo ""

# Step 1: Kill all Node.js processes
echo "1️⃣  Killing all Node.js processes..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "npx.*next" 2>/dev/null || true
sleep 2

# Step 2: Clear build caches only
echo "2️⃣  Clearing build caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "   ✅ Build caches cleared"

# Step 3: Check for port conflicts
echo "3️⃣  Checking for port conflicts..."
PORTS=(3000 3001 3002)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo "   🔥 Killing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done
echo "   ✅ Port conflicts resolved"

# Step 4: Restart development server
echo "4️⃣  Starting clean development server..."
echo "   🚀 Running: npm run dev"
echo ""
echo "⚡ QUICK CLEANUP COMPLETE! ⚡"
echo "============================="
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Wait for server to start"
echo "   2. Hard refresh browser (Cmd+Shift+R)"
echo ""

# Start the server
npm run dev 