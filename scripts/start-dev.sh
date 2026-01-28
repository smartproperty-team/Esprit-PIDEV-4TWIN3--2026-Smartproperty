#!/bin/bash
# ===========================================
# SmartProperty - Quick Start Script (Linux/Mac)
# ===========================================
# This script starts all required services for development

echo "🚀 Starting SmartProperty Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Navigate to project root
cd "$(dirname "$0")/.."

# Start Docker containers
echo ""
echo "📦 Starting Docker containers (MongoDB, Redis, MailHog)..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker containers"
    exit 1
fi

echo "✅ Docker containers started"

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Display service URLs
echo ""
echo "============================================"
echo "🎉 Development Environment Ready!"
echo "============================================"
echo ""
echo "📊 Service URLs:"
echo "   MongoDB:         localhost:27017"
echo "   Mongo Express:   http://localhost:8081 (admin/admin123)"
echo "   Redis:           localhost:6379"
echo "   Redis Commander: http://localhost:8082 (admin/admin123)"
echo "   MailHog UI:      http://localhost:8025"
echo ""
echo "📝 Next Steps:"
echo "   1. cd backend && npm install"
echo "   2. cd frontend && npm install"
echo "   3. npm run dev (from root to start both)"
echo ""
