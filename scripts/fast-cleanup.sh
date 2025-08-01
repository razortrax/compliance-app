#!/bin/bash

echo "⚡ FLEETRAX FAST CLEANUP (30 seconds)"
echo "====================================="
echo ""

# Step 1: Kill all Node.js processes (2 seconds)
echo "1️⃣  Killing all Node.js processes..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "npx.*next" 2>/dev/null || true
sleep 2
echo "   ✅ Processes killed"

# Step 2: Clear build caches (5 seconds)
echo "2️⃣  Clearing build caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf out
echo "   ✅ Build caches cleared"

# Step 3: Check for port conflicts (3 seconds)
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
echo ""
echo "⚡ FAST CLEANUP COMPLETE! (Total time: ~10 seconds) ⚡"
echo "===================================================="
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Server should start in 10-15 seconds"
echo "   2. Hard refresh browser (Cmd+Shift+R)"
echo "   3. Go to: http://localhost:3000"
echo ""

# Start the server
npm run dev 