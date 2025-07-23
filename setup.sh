#!/bin/bash
# === setup.sh ===
# Installation script for Interactive Project Tool

echo "🚀 Interactive Project Tool Setup v1.2"
echo "====================================="
echo "✨ Now with enhanced import features!"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 12 ]; then
    echo "❌ Node.js version 12 or higher is required!"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Make the script executable
chmod +x project-tool.js
echo "✅ Made project-tool.js executable"

# Ask for installation type
echo ""
echo "Choose installation type:"
echo "1. Global installation (recommended)"
echo "2. Local installation"
echo "3. Skip installation (just make executable)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🔄 Installing globally..."
        npm install -g .
        echo "✅ Global installation complete!"
        echo "You can now run 'project-tool' from anywhere"
        ;;
    2)
        echo "🔄 Installing locally..."
        npm install
        echo "✅ Local installation complete!"
        echo "Run with: ./project-tool.js or npm start"
        ;;
    3)
        echo "✅ Setup complete!"
        echo "Run with: ./project-tool.js"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 What's new in v1.2:"
echo "  • Enhanced import with directory browser"
echo "  • Create new folders during import"
echo "  • Step-by-step import wizard"
echo "  • Better error handling"
echo ""
echo "To start the tool, run:"
if [ "$choice" = "1" ]; then
    echo "  project-tool"
else
    echo "  ./project-tool.js"
fi