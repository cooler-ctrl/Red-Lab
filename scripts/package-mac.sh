#!/usr/bin/env bash
set -e

# RedLab macOS Desktop Packager
# Produces RedLab.dmg and RedLab-mac.zip

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== RedLab Desktop Build (macOS) ==="
echo "Working directory: $ROOT_DIR"

# 1. Generate icons
echo "--> Generating icons..."
python3 "$ROOT_DIR/scripts/generate_icons.py"

# 2. Build Frontend
echo "--> Building React frontend..."
cd "$ROOT_DIR/frontend"
npm install
npm run build

# 3. Build Backend Binary with PyInstaller
echo "--> Compiling Python backend binary..."
cd "$ROOT_DIR/backend"
python3 -m PyInstaller redlab-backend.spec --noconfirm

# 4. Prepare desktop bundle staging
echo "--> Staging backend binary for Electron..."
mkdir -p "$ROOT_DIR/desktop/dist-backend"
rm -rf "$ROOT_DIR/desktop/dist-backend/redlab-backend"
cp -R "$ROOT_DIR/backend/dist/redlab-backend" "$ROOT_DIR/desktop/dist-backend/redlab-backend"

# 5. Build Desktop DMG and App Bundle
echo "--> Building macOS DMG with electron-builder..."
cd "$ROOT_DIR/desktop"
npm install
npm run build:mac

echo ""
echo "=== Build Complete! ==="
echo "The downloadable macOS installer and application are available in:"
echo "$ROOT_DIR/desktop/dist"
ls -la "$ROOT_DIR/desktop/dist"/*.dmg "$ROOT_DIR/desktop/dist"/*.zip 2>/dev/null || true
