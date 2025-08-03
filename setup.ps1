# Project Tool Setup Script for Windows
# Version 4.0.0

Write-Host "🚀 Installing Project Tool..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 14.0.0 or higher from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Parse version
$version = $nodeVersion -replace 'v', ''
$versionParts = $version.Split('.')
$majorVersion = [int]$versionParts[0]

if ($majorVersion -lt 14) {
    Write-Host "❌ Node.js version $nodeVersion is too old!" -ForegroundColor Red
    Write-Host "Please upgrade to Node.js 14.0.0 or higher" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green

# Check execution policy
$executionPolicy = Get-ExecutionPolicy -Scope CurrentUser
if ($executionPolicy -eq "Restricted") {
    Write-Host ""
    Write-Host "⚠️  PowerShell execution policy is restricted" -ForegroundColor Yellow
    Write-Host "Setting execution policy for current user..." -ForegroundColor Cyan
    
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Host "✅ Execution policy updated" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to update execution policy" -ForegroundColor Red
        Write-Host "Please run as Administrator or use:" -ForegroundColor Yellow
        Write-Host "  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
    }
}

# Check if already installed
Write-Host ""
Write-Host "🔍 Checking for existing installation..." -ForegroundColor Cyan

$existingVersion = $null
try {
    $existingVersion = project-tool --version 2>$null
    if ($existingVersion) {
        Write-Host "⚠️  Project Tool v$existingVersion is already installed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Choose an option:" -ForegroundColor Cyan
        Write-Host "  1. Reinstall/Update (recommended)" -ForegroundColor White
        Write-Host "  2. Uninstall first, then install" -ForegroundColor White
        Write-Host "  3. Cancel" -ForegroundColor White
        Write-Host ""
        
        $choice = Read-Host "Enter your choice (1-3)"
        
        switch ($choice) {
            "1" {
                Write-Host "📦 Reinstalling..." -ForegroundColor Cyan
                $npmOutput = npm install -g . --force 2>&1
                $success = $LASTEXITCODE -eq 0
            }
            "2" {
                Write-Host "🗑️  Uninstalling existing version..." -ForegroundColor Yellow
                npm uninstall -g project-tool
                Write-Host "📦 Installing fresh..." -ForegroundColor Cyan
                $npmOutput = npm install -g . 2>&1
                $success = $LASTEXITCODE -eq 0
            }
            default {
                Write-Host "❌ Installation cancelled" -ForegroundColor Red
                exit 0
            }
        }
    }
} catch {
    # Not installed, proceed with normal installation
    Write-Host "📦 Installing globally..." -ForegroundColor Cyan
    $npmOutput = npm install -g . 2>&1
    $success = $LASTEXITCODE -eq 0
}

if ($success) {
    Write-Host ""
    Write-Host "✅ Project Tool installed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify installation
    $installedVersion = project-tool --version 2>$null
    if ($installedVersion) {
        Write-Host "📌 Installed version: $installedVersion" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📝 Usage:" -ForegroundColor Yellow
    Write-Host "  project-tool          # Run interactive mode" -ForegroundColor White
    Write-Host "  project-tool --help   # Show help" -ForegroundColor White
    Write-Host "  project-tool --setup  # Setup API keys" -ForegroundColor White
    Write-Host "  project-tool --sync   # Sync translations" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Quick start:" -ForegroundColor Cyan
    Write-Host "  1. Run 'project-tool' to start" -ForegroundColor White
    Write-Host "  2. Choose 'Export Project' to export your code" -ForegroundColor White
    Write-Host "  3. Choose 'Manage Translations' for translation features" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Global installation failed." -ForegroundColor Yellow
    
    if ($npmOutput -match "EEXIST") {
        Write-Host ""
        Write-Host "💡 Try these solutions:" -ForegroundColor Cyan
        Write-Host "  1. Run this command to force reinstall:" -ForegroundColor White
        Write-Host "     npm install -g . --force" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  2. Or uninstall first:" -ForegroundColor White
        Write-Host "     npm uninstall -g project-tool" -ForegroundColor Yellow
        Write-Host "     npm install -g ." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "You can still run locally:" -ForegroundColor Yellow
    Write-Host "  node index.js" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $npmOutput
}