# Interactive Project Tool Setup Script for Windows

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   INTERACTIVE PROJECT TOOL SETUP       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    if ($nodeVersion) {
        $version = $nodeVersion -replace 'v', ''
        $majorVersion = [int]($version.Split('.')[0])
        
        if ($majorVersion -lt 14) {
            Write-Host "❌ Node.js version $nodeVersion is too old!" -ForegroundColor Red
            Write-Host "Please update to Node.js 14.0.0 or higher from https://nodejs.org" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 14.0.0 or higher from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Ask if user wants to install globally
Write-Host "Would you like to install globally? (you can run 'project-tool' from anywhere)" -ForegroundColor Yellow
Write-Host "This requires npm and administrator permissions." -ForegroundColor Yellow
$response = Read-Host "Install globally? (y/N)"

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "📦 Installing globally..." -ForegroundColor Cyan
    
    # Check if running as administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    
    if (-not $isAdmin) {
        Write-Host "⚠️  Not running as administrator. Trying to install anyway..." -ForegroundColor Yellow
    }
    
    try {
        npm install -g .
        Write-Host "✅ Global installation successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run 'project-tool' from anywhere" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Global installation failed." -ForegroundColor Yellow
        Write-Host "Try running PowerShell as Administrator and run:" -ForegroundColor Yellow
        Write-Host "  npm install -g ." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "For now, you can still run locally with: node project-tool.js" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Local installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run the tool with: node project-tool.js" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick start:" -ForegroundColor Cyan
Write-Host "  - Export a project: Select 'Export Project' from the menu" -ForegroundColor White
Write-Host "  - Import a project: Select 'Import Project' from the menu" -ForegroundColor White
Write-Host "  - Create structure: Select 'Create Structure from Tree' from the menu" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")