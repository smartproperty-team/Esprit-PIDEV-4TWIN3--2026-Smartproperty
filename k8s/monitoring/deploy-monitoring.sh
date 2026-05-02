#!/bin/bash
# ===========================================
# SmartProperty - Monitoring Stack Deployment
# ===========================================
# Deploys Prometheus + Grafana + AlertManager
# Usage: ./deploy-monitoring.sh

set -e

echo "=== SmartProperty Monitoring Stack ==="

# 1. Create namespace
echo "[1/5] Creating monitoring namespace..."
kubectl apply -f namespace.yaml

# 2. Deploy Prometheus RBAC
echo "[2/5] Setting up Prometheus RBAC..."
kubectl apply -f prometheus-rbac.yaml

# 3. Deploy Prometheus
echo "[3/5] Deploying Prometheus..."
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus.yaml

# 4. Deploy AlertManager
echo "[4/5] Deploying AlertManager..."
kubectl apply -f alertmanager-config.yaml
kubectl apply -f alertmanager.yaml

# 5. Deploy Grafana
echo "[5/5] Deploying Grafana..."
kubectl apply -f grafana.yaml

# Wait for pods
echo ""
echo "Waiting for monitoring pods..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=alertmanager -n monitoring --timeout=60s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Show status
echo ""
echo "=== Monitoring Stack Deployed ==="
echo ""
kubectl get pods -n monitoring
echo ""
kubectl get svc -n monitoring
echo ""
echo "Access URLs (NodePort):"
echo "  Prometheus:    http://<node-ip>:30900"
echo "  AlertManager:  http://<node-ip>:30903"
echo "  Grafana:       http://<node-ip>:30300"
echo ""
echo "Grafana Credentials:"
echo "  Username: admin"
echo "  Password: smartproperty2024"
