# === update.ps1 ===
# Update script for Windows PowerShell

Write-Host "🔄 Updating Interactive Project Tool to v1.2" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check current version if exists
if (Test-Path "VERSION") {
    $currentVersion = Get-Content VERSION
    Write-Host "📌 Current version: $currentVersion" -ForegroundColor Yellow
} else {
    Write-Host "📌 Current version: Unknown" -ForegroundColor Yellow
}

Write-Host "📌 New version: 1.2.0" -ForegroundColor Green
Write-Host ""

# Backup current tool if exists
if (Test-Path "project-tool.js") {
    Write-Host "💾 Creating backup of current version..." -ForegroundColor Cyan
    Copy-Item project-tool.js project-tool.backup.js
    Write-Host "✅ Backup created: project-tool.backup.js" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 New features in v1.2:" -ForegroundColor Cyan
Write-Host "  • Enhanced import process with step-by-step wizard" -ForegroundColor White
Write-Host "  • Directory browser for selecting import destination" -ForegroundColor White
Write-Host "  • Option to create new folders with custom names" -ForegroundColor White
Write-Host "  • Better error handling for existing folders" -ForegroundColor White
Write-Host ""

Write-Host "✅ Update information complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To complete the update:" -ForegroundColor Yellow
Write-Host "1. Replace your project-tool.js with the new version"
Write-Host "2. Start using: node project-tool.js"