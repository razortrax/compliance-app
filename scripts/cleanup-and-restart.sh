#!/bin/bash

echo "🧹 FLEETRAX CLEANUP & RESTART ROUTINE"
echo "===================================="
echo ""

# Step 1: Kill all Node.js processes
echo "1️⃣  Killing all Node.js processes..."
pkill -f "node.*next" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "npx.*next" 2>/dev/null || true
sleep 2

# Step 2: Clear all caches
echo "2️⃣  Clearing all caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf out
echo "   ✅ Build caches cleared"

# Step 3: Clear package manager caches
echo "3️⃣  Clearing package manager caches..."
npm cache clean --force 2>/dev/null || true
echo "   ✅ NPM cache cleared"

# Step 4: Remove node_modules and package-lock (aggressive cleanup)
echo "4️⃣  Performing aggressive cleanup..."
read -p "   🚨 Remove node_modules and reinstall? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    rm -f package-lock.json
    echo "   ✅ Node modules removed"
fi

# Step 5: Reinstall dependencies
echo "5️⃣  Reinstalling dependencies..."
npm install
echo "   ✅ Dependencies reinstalled"

# Step 6: Clear browser cache reminder
echo "6️⃣  Browser cache..."
echo "   🚨 REMINDER: Clear your browser cache and hard refresh (Cmd+Shift+R)"
echo ""

# Step 7: Check for port conflicts
echo "7️⃣  Checking for port conflicts..."
PORTS=(3000 3001 3002)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo "   🔥 Killing process on port $port (PID: $PID)"
        kill -9 $PID 2>/dev/null || true
    fi
done
echo "   ✅ Port conflicts resolved"

# Step 8: Restart development server
echo "8️⃣  Starting clean development server..."
echo "   🚀 Running: npm run dev"
echo ""
echo "✨ CLEANUP COMPLETE! ✨"
echo "========================"
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Wait for server to start (should be on port 3000)"
echo "   2. Hard refresh browser (Cmd+Shift+R)"
echo "   3. Clear browser cache if still having issues"
echo "   4. If problems persist, try incognito/private browsing"
echo ""

# Start the server
npm run dev 