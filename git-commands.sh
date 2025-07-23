#!/bin/bash
# git-commands.sh - Quick setup commands for GitHub

# IMPORTANT: Replace YOUR_USERNAME with your actual GitHub username!

echo "==================================="
echo "Git Commands for Project Setup"
echo "==================================="
echo ""
echo "Step 1: Initialize Git"
echo "----------------------"
echo "git init"
echo "git add ."
echo 'git commit -m "Initial commit: Interactive Project Export/Import Tool v1.2"'
echo ""
echo "Step 2: Create and push to GitHub"
echo "---------------------------------"
echo "git remote add origin https://github.com/YOUR_USERNAME/interactive-project-tool.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "Step 3: Add additional files (optional)"
echo "--------------------------------------"
echo "# Create .gitignore"
echo 'cat > .gitignore << EOF
node_modules/
*.log
.DS_Store
recovered/
export_*.txt
*.backup.js
.env
.idea/
.vscode/
*.swp
*.swo
*~
.npm
.yarn
dist/
build/
coverage/
.cache/
EOF'
echo ""
echo "# Create LICENSE"
echo 'cat > LICENSE << EOF
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF'
echo ""
echo "# Commit additional files"
echo "git add .gitignore LICENSE"
echo 'git commit -m "Add .gitignore and LICENSE"'
echo "git push"
echo ""
echo "==================================="
echo "Don't forget to:"
echo "1. Replace YOUR_USERNAME with your GitHub username"
echo "2. Create the repository on GitHub first"
echo "3. Make sure you're in the project directory"
echo "==================================="

# Optional: Uncomment below lines to execute commands automatically
# read -p "Enter your GitHub username: " username
# git init
# git add .
# git commit -m "Initial commit: Interactive Project Export/Import Tool v1.2"
# git remote add origin https://github.com/$username/interactive-project-tool.git
# git branch -M main
# git push -u origin main