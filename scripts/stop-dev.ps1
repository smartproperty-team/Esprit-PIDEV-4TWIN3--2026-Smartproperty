# ===========================================
# SmartProperty - Stop Development Environment
# ===========================================
# Usage: .\scripts\stop-dev.ps1
# Usage: .\scripts\stop-dev.ps1 -DeleteData   (also removes volumes)

param(
    [switch]$DeleteData
)

Write-Host ""
Write-Host "Stopping SmartProperty Development Environment..." -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if ($DeleteData) {
    Write-Host "  (Also removing volumes/data)" -ForegroundColor Yellow
    docker compose down -v
} else {
    docker compose down
}

Write-Host ""
Write-Host "[OK] All services stopped" -ForegroundColor Green
Write-Host ""
