#!/bin/bash

echo "🤖 FLEETRAX AUTO CLEANUP - Detecting corruption level..."
echo "======================================================="

# Check for signs of severe corruption
VENDOR_CHUNK_ERRORS=$(grep -r "vendor-chunks" .next/server 2>/dev/null | wc -l || echo "0")
CACHE_ERRORS=$(ls .next/cache 2>/dev/null | wc -l || echo "0")

echo "🔍 Diagnosing..."
echo "   Vendor chunk references: $VENDOR_CHUNK_ERRORS"
echo "   Cache directory status: $CACHE_ERRORS"

if [ "$VENDOR_CHUNK_ERRORS" -gt 0 ] || [ "$CACHE_ERRORS" -eq 0 ]; then
    echo ""
    echo "🚨 SEVERE CORRUPTION DETECTED!"
    echo "   - Vendor chunk errors found"
    echo "   - Running NUCLEAR CLEANUP..."
    echo ""
    
    # Nuclear cleanup
    echo "1️⃣  Killing processes..."
    pkill -f "node.*next" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    sleep 2
    
    echo "2️⃣  Nuclear cleanup..."
    rm -rf .next node_modules package-lock.json
    
    echo "3️⃣  Reinstalling dependencies..."
    npm install --silent
    
    echo "4️⃣  Starting server..."
    echo ""
    echo "☢️  NUCLEAR CLEANUP COMPLETE! (~45 seconds)"
    echo "============================================="
    
else
    echo ""
    echo "ℹ️  Minor corruption detected"
    echo "   - Running FAST CLEANUP..."
    echo ""
    
    # Fast cleanup
    echo "1️⃣  Killing processes..."
    pkill -f "node.*next" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    sleep 2
    
    echo "2️⃣  Clearing caches..."
    rm -rf .next node_modules/.cache .turbo
    
    echo "3️⃣  Starting server..."
    echo ""
    echo "⚡ FAST CLEANUP COMPLETE! (~10 seconds)"
    echo "======================================="
fi

echo ""
echo "📝 NEXT STEPS:"
echo "   1. Wait for server to start"
echo "   2. Hard refresh browser (Cmd+Shift+R)"
echo "   3. Go to: http://localhost:3000"
echo ""

npm run dev 