# ===========================================
# SmartProperty - Stop Development Environment
# ===========================================

Write-Host "🛑 Stopping SmartProperty Development Environment..." -ForegroundColor Cyan

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Stop Docker containers
docker-compose down

Write-Host ""
Write-Host "✅ All services stopped" -ForegroundColor Green
