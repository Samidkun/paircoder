#!/usr/bin/env bash
set -eo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "      PAIRCODER LOCAL CI VERIFICATION SUITE       "
echo "=================================================="

# GATE 1: Backend PHPUnit Tests
echo ""
echo "[1/4] Running Backend PHPUnit Tests..."
cd "$REPO_ROOT/backend"
./vendor/bin/phpunit
echo "✓ Backend PHPUnit tests passed."

# GATE 2: CRDT Concurrency Convergence
echo ""
echo "[2/4] Testing Yjs CRDT Concurrency Convergence..."
cd "$REPO_ROOT/frontend"
node test-crdt.mjs
echo "✓ CRDT convergence passed."

# GATE 3: Frontend TypeScript & Vite Production Build
echo ""
echo "[3/4] Building Frontend (TypeScript check + Vite bundle)..."
cd "$REPO_ROOT/frontend"
pnpm build
echo "✓ Frontend build passed."

# GATE 4: Playwright Browser End-to-End Tests
echo ""
echo "[4/4] Executing Playwright E2E Browser Suite..."
cd "$REPO_ROOT/frontend"
pnpm exec playwright test
echo "✓ Playwright E2E suite passed."

echo ""
echo "=================================================="
echo "  ALL GATES GREEN! PAIRCODER IS READY TO SHIP.   "
echo "=================================================="
