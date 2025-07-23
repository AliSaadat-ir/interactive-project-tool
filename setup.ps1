# === setup.ps1 ===
# PowerShell installation script for Windows

Write-Host "🚀 Interactive Project Tool Setup v1.2" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✨ Now with enhanced import features!" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$version = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($version -lt 12) {
    Write-Host "❌ Node.js version 12 or higher is required!" -ForegroundColor Red
    Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Choose installation type:" -ForegroundColor Yellow
Write-Host "1. Global installation (recommended)"
Write-Host "2. Local installation"
Write-Host "3. Skip installation"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🔄 Installing globally..." -ForegroundColor Cyan
        npm install -g .
        Write-Host "✅ Global installation complete!" -ForegroundColor Green
        Write-Host "You can now run 'project-tool' from anywhere" -ForegroundColor Green
    }
    "2" {
        Write-Host "🔄 Installing locally..." -ForegroundColor Cyan
        npm install
        Write-Host "✅ Local installation complete!" -ForegroundColor Green
        Write-Host "Run with: node project-tool.js or npm start" -ForegroundColor Green
    }
    "3" {
        Write-Host "✅ Setup complete!" -ForegroundColor Green
        Write-Host "Run with: node project-tool.js" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What's new in v1.2:" -ForegroundColor Cyan
Write-Host "  • Enhanced import with directory browser" -ForegroundColor White
Write-Host "  • Create new folders during import" -ForegroundColor White
Write-Host "  • Step-by-step import wizard" -ForegroundColor White
Write-Host "  • Better error handling" -ForegroundColor White
Write-Host ""
Write-Host "To start the tool, run:" -ForegroundColor Cyan

if ($choice -eq "1") {
    Write-Host "  project-tool" -ForegroundColor Yellow
} else {
    Write-Host "  node project-tool.js" -ForegroundColor Yellow
}