#!/bin/bash

# Project Tool Setup Script for Linux/macOS
# Version 4.0.0

echo "🚀 Installing Project Tool..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 14.0.0 or higher from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old!"
    echo "Please upgrade to Node.js 14.0.0 or higher"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Make main script executable
chmod +x index.js
chmod +x bin/project-tool.js

# Check if already installed
echo ""
echo "🔍 Checking for existing installation..."

if command -v project-tool &> /dev/null; then
    EXISTING_VERSION=$(project-tool --version 2>/dev/null)
    echo "⚠️  Project Tool v$EXISTING_VERSION is already installed"
    echo ""
    echo "Choose an option:"
    echo "  1. Reinstall/Update (recommended)"
    echo "  2. Uninstall first, then install"
    echo "  3. Cancel"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "📦 Reinstalling..."
            npm install -g . --force
            ;;
        2)
            echo "🗑️  Uninstalling existing version..."
            npm uninstall -g project-tool
            echo "📦 Installing fresh..."
            npm install -g .
            ;;
        *)
            echo "❌ Installation cancelled"
            exit 0
            ;;
    esac
else
    # Not installed, proceed with normal installation
    echo "📦 Installing globally..."
    npm install -g .
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Project Tool installed successfully!"
    echo ""
    
    # Verify installation
    if command -v project-tool &> /dev/null; then
        INSTALLED_VERSION=$(project-tool --version 2>/dev/null)
        echo "📌 Installed version: $INSTALLED_VERSION"
    fi
    
    echo ""
    echo "📝 Usage:"
    echo "  project-tool          # Run interactive mode"
    echo "  project-tool --help   # Show help"
    echo "  project-tool --setup  # Setup API keys"
    echo "  project-tool --sync   # Sync translations"
    echo ""
    echo "🎯 Quick start:"
    echo "  1. Run 'project-tool' to start"
    echo "  2. Choose 'Export Project' to export your code"
    echo "  3. Choose 'Manage Translations' for translation features"
    echo ""
else
    echo ""
    echo "⚠️  Global installation failed."
    
    if [[ $? -eq 17 ]]; then
        echo ""
        echo "💡 Try these solutions:"
        echo "  1. Run this command to force reinstall:"
        echo "     npm install -g . --force"
        echo ""
        echo "  2. Or uninstall first:"
        echo "     npm uninstall -g project-tool"
        echo "     npm install -g ."
    fi
    
    echo ""
    echo "You can still run locally:"
    echo "  ./index.js"
    echo "  or"
    echo "  node index.js"
fi