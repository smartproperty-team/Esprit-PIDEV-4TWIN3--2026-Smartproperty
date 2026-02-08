#!/bin/bash
# ===========================================
# SmartProperty - Full Docker Start (Linux/Mac)
# ===========================================
# Starts the ENTIRE stack in Docker. No local Node/Python needed.
# Usage: ./scripts/start-dev.sh
# Usage: ./scripts/start-dev.sh --infra-only  (just DB + cache + mail)
# Usage: ./scripts/start-dev.sh --build       (rebuild images first)
# Usage: ./scripts/start-dev.sh --logs        (attach to logs after start)

set -e

INFRA_ONLY=false
BUILD=false
LOGS=false

for arg in "$@"; do
    case $arg in
        --infra-only) INFRA_ONLY=true ;;
        --build) BUILD=true ;;
        --logs) LOGS=true ;;
    esac
done

echo ""
echo "============================================"
echo "  SmartProperty - Docker Dev Environment"
echo "============================================"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker first."
    exit 1
fi
echo "[OK] Docker is running"

# Navigate to project root
cd "$(dirname "$0")/.."

# Determine services
if [ "$INFRA_ONLY" = true ]; then
    echo ""
    echo "[..] Starting infrastructure only (MongoDB, Redis, MailHog)..."
    SERVICES="mongodb redis mailhog mongo-express redis-commander"
else
    echo ""
    echo "[..] Starting full stack..."
    SERVICES=""
fi

# Build if requested
if [ "$BUILD" = true ]; then
    echo "[..] Building images..."
    docker compose build $SERVICES
fi

# Start
docker compose up -d $SERVICES

# Wait for health checks
echo ""
echo "[..] Waiting for services to become healthy..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    STARTING=$(docker compose ps --format json 2>/dev/null | grep -c '"starting"' || true)
    if [ "$STARTING" -eq 0 ]; then break; fi
    sleep 3
    ELAPSED=$((ELAPSED + 3))
    echo "    Waiting... (${ELAPSED}s)"
done

# Show status
echo ""
docker compose ps

echo ""
echo "============================================"
echo "  All services are running!"
echo "============================================"
echo ""
echo "  Service URLs:"
echo "  -----------------------------------------------"

if [ "$INFRA_ONLY" = false ]; then
    echo "  Frontend:        http://localhost:5173"
    echo "  Backend API:     http://localhost:3000/api"
    echo "  Swagger Docs:    http://localhost:3000/api/docs"
    echo "  AI Services:     http://localhost:8000"
fi

echo "  Mongo Express:   http://localhost:8081  (admin / admin123)"
echo "  Redis Commander: http://localhost:8082  (admin / admin123)"
echo "  MailHog UI:      http://localhost:8025"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f backend       # Backend logs"
echo "    docker compose logs -f frontend      # Frontend logs"
echo "    docker compose restart backend       # Restart backend"
echo "    docker compose up -d --build backend # Rebuild & restart"
echo "    docker compose down                  # Stop everything"
echo "    docker compose down -v               # Stop + delete data"
echo ""

if [ "$LOGS" = true ]; then
    echo "[..] Attaching to logs (Ctrl+C to detach)..."
    if [ "$INFRA_ONLY" = true ]; then
        docker compose logs -f mongodb redis mailhog
    else
        docker compose logs -f backend frontend ai-services
    fi
fi
