Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Git Commands for Project Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Function to display commands
function Show-Commands {
    Write-Host "Step 1: Initialize Git" -ForegroundColor Yellow
    Write-Host "----------------------" -ForegroundColor Yellow
    Write-Host "git init" -ForegroundColor Green
    Write-Host "git add ." -ForegroundColor Green
    Write-Host 'git commit -m "Initial commit: Interactive Project Export/Import Tool v1.2"' -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 2: Create and push to GitHub" -ForegroundColor Yellow
    Write-Host "---------------------------------" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/interactive-project-tool.git" -ForegroundColor Green
    Write-Host "git branch -M main" -ForegroundColor Green
    Write-Host "git push -u origin main" -ForegroundColor Green
    Write-Host ""
}

# Show commands
Show-Commands

# Ask if user wants to execute
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "IMPORTANT:" -ForegroundColor Red
Write-Host "1. Replace YOUR_USERNAME with your GitHub username" -ForegroundColor White
Write-Host "2. Create the repository on GitHub first" -ForegroundColor White
Write-Host "3. Make sure you're in the project directory" -ForegroundColor White
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Do you want to execute these commands now? (y/n)"

if ($response -eq 'y') {
    $username = Read-Host "Enter your GitHub username"
    
    Write-Host "`nExecuting commands..." -ForegroundColor Yellow
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial commit: Interactive Project Export/Import Tool v1.2"
    
    # Add remote and push
    git remote add origin "https://github.com/$username/interactive-project-tool.git"
    git branch -M main
    git push -u origin main
    
    # Create .gitignore
    $gitignoreContent = @"
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
"@
    Set-Content -Path ".gitignore" -Value $gitignoreContent
    
    # Create LICENSE
    $licenseContent = @"
MIT License

Copyright (c) 2024 $username

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
"@
    Set-Content -Path "LICENSE" -Value $licenseContent
    
    # Commit additional files
    git add .gitignore LICENSE
    git commit -m "Add .gitignore and LICENSE"
    git push
    
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "Your repository is available at: https://github.com/$username/interactive-project-tool" -ForegroundColor Cyan
} else {
    Write-Host "`nYou can copy and run the commands manually from above." -ForegroundColor Yellow
}