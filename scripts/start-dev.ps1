# ===========================================
# SmartProperty - Quick Start Script (Windows)
# ===========================================
# This script starts all required services for development

Write-Host "🚀 Starting SmartProperty Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Start Docker containers
Write-Host ""
Write-Host "📦 Starting Docker containers (MongoDB, Redis, MailHog)..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker containers started" -ForegroundColor Green

# Wait for services to be ready
Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Display service URLs
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 Development Environment Ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Yellow
Write-Host "   MongoDB:         localhost:27017" -ForegroundColor White
Write-Host "   Mongo Express:   http://localhost:8081 (admin/admin123)" -ForegroundColor White
Write-Host "   Redis:           localhost:6379" -ForegroundColor White
Write-Host "   Redis Commander: http://localhost:8082 (admin/admin123)" -ForegroundColor White
Write-Host "   MailHog UI:      http://localhost:8025" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. cd backend && npm install" -ForegroundColor White
Write-Host "   2. cd frontend && npm install" -ForegroundColor White
Write-Host "   3. npm run dev (from root to start both)" -ForegroundColor White
Write-Host ""
