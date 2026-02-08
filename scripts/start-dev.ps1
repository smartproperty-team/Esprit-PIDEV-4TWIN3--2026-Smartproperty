# ===========================================
# SmartProperty - Full Docker Start (Windows)
# ===========================================
# Starts the ENTIRE stack in Docker. No local Node/Python needed.
# Usage: .\scripts\start-dev.ps1
# Usage: .\scripts\start-dev.ps1 -InfraOnly  (just DB + cache + mail)

param(
    [switch]$InfraOnly,
    [switch]$Build,
    [switch]$Logs
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SmartProperty - Docker Dev Environment"     -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Determine which services to start
if ($InfraOnly) {
    Write-Host ""
    Write-Host "[..] Starting infrastructure only (MongoDB, Redis, MailHog)..." -ForegroundColor Yellow
    $services = "mongodb", "redis", "mailhog", "mongo-express", "redis-commander"
} else {
    Write-Host ""
    Write-Host "[..] Starting full stack..." -ForegroundColor Yellow
    $services = $null  # all services
}

# Build if requested or first time
if ($Build) {
    Write-Host "[..] Building images..." -ForegroundColor Yellow
    if ($services) {
        docker compose build $services
    } else {
        docker compose build
    }
}

# Start containers
if ($services) {
    docker compose up -d $services
} else {
    docker compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

# Wait for health checks
Write-Host ""
Write-Host "[..] Waiting for services to become healthy..." -ForegroundColor Yellow
$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    $unhealthy = docker compose ps --format json 2>$null | ConvertFrom-Json | Where-Object { $_.Health -eq "starting" }
    if (-not $unhealthy) { break }
    Start-Sleep -Seconds 3
    $elapsed += 3
    Write-Host "    Waiting... ($elapsed s)" -ForegroundColor DarkGray
}

# Show status
Write-Host ""
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All services are running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Service URLs:" -ForegroundColor Yellow
Write-Host "  -----------------------------------------------"

if (-not $InfraOnly) {
    Write-Host "  Frontend:        http://localhost:5173"          -ForegroundColor White
    Write-Host "  Backend API:     http://localhost:3000/api"      -ForegroundColor White
    Write-Host "  Swagger Docs:    http://localhost:3000/api/docs" -ForegroundColor White
    Write-Host "  AI Services:     http://localhost:8000"          -ForegroundColor White
}

Write-Host "  Mongo Express:   http://localhost:8081  (admin / admin123)" -ForegroundColor White
Write-Host "  Redis Commander: http://localhost:8082  (admin / admin123)" -ForegroundColor White
Write-Host "  MailHog UI:      http://localhost:8025"                     -ForegroundColor White
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Yellow
Write-Host "    docker compose logs -f backend       # Backend logs"
Write-Host "    docker compose logs -f frontend      # Frontend logs"
Write-Host "    docker compose restart backend       # Restart backend"
Write-Host "    docker compose up -d --build backend # Rebuild & restart"
Write-Host "    docker compose down                  # Stop everything"
Write-Host "    docker compose down -v               # Stop + delete data"
Write-Host ""

if ($Logs) {
    Write-Host "[..] Attaching to logs (Ctrl+C to detach)..." -ForegroundColor Yellow
    if ($InfraOnly) {
        docker compose logs -f mongodb redis mailhog
    } else {
        docker compose logs -f backend frontend ai-services
    }
}
