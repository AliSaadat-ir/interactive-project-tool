#!/bin/bash

# Interactive Project Tool Setup Script for Linux/macOS

echo "╔════════════════════════════════════════╗"
echo "║   INTERACTIVE PROJECT TOOL SETUP       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 14.0.0 or higher from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ $NODE_MAJOR -lt 14 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old!"
    echo "Please update to Node.js 14.0.0 or higher"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"
echo ""

# Make the script executable
echo "🔧 Making project-tool.js executable..."
chmod +x project-tool.js

# Ask if user wants to install globally
echo ""
echo "Would you like to install globally? (you can run 'project-tool' from anywhere)"
echo "This requires npm and may need sudo permissions."
read -p "Install globally? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing globally..."
    if npm install -g .; then
        echo "✅ Global installation successful!"
        echo ""
        echo "You can now run 'project-tool' from anywhere"
    else
        echo "⚠️  Global installation failed. You may need to run with sudo:"
        echo "sudo npm install -g ."
        echo ""
        echo "For now, you can still run locally with: ./project-tool.js"
    fi
else
    echo "✅ Local installation complete!"
    echo ""
    echo "Run the tool with: ./project-tool.js"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Quick start:"
echo "  - Export a project: Select 'Export Project' from the menu"
echo "  - Import a project: Select 'Import Project' from the menu"
echo "  - Create structure: Select 'Create Structure from Tree' from the menu"
echo ""
echo "For more information, see README.md"