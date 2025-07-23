#!/bin/bash
# === update.sh ===
# Update script for Interactive Project Tool

echo "🔄 Updating Interactive Project Tool to v1.2"
echo "==========================================="
echo ""

# Check current version if exists
if [ -f "VERSION" ]; then
    CURRENT_VERSION=$(cat VERSION)
    echo "📌 Current version: $CURRENT_VERSION"
else
    echo "📌 Current version: Unknown"
fi

echo "📌 New version: 1.2.0"
echo ""

# Backup current tool if exists
if [ -f "project-tool.js" ]; then
    echo "💾 Creating backup of current version..."
    cp project-tool.js project-tool.backup.js
    echo "✅ Backup created: project-tool.backup.js"
fi

echo ""
echo "📋 New features in v1.2:"
echo "  • Enhanced import process with step-by-step wizard"
echo "  • Directory browser for selecting import destination"
echo "  • Option to create new folders with custom names"
echo "  • Better error handling for existing folders"
echo ""

echo "✅ Update information complete!"
echo ""
echo "To complete the update:"
echo "1. Replace your project-tool.js with the new version"
echo "2. Run: chmod +x project-tool.js"
echo "3. Start using: ./project-tool.js"