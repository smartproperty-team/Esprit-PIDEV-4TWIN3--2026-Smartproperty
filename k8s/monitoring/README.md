# SmartProperty - Monitoring Stack

## Architecture

The monitoring stack runs in a dedicated `monitoring` namespace and consists of:

| Component | Image | Purpose | Port |
|-----------|-------|---------|------|
| **Prometheus** | prom/prometheus:v2.51.0 | Metrics collection & alerting rules | 30900 |
| **AlertManager** | prom/alertmanager:v0.27.0 | Alert routing & notification | 30903 |
| **Grafana** | grafana/grafana:10.4.0 | Dashboards & visualization | 30300 |

## Access URLs

| Service | URL |
|---------|-----|
| Prometheus | http://\<node-ip\>:30900 |
| AlertManager | http://\<node-ip\>:30903 |
| Grafana | http://\<node-ip\>:30300 |

**Grafana credentials:** admin / smartproperty2024

## Deployment

```bash
cd k8s/monitoring
chmod +x deploy-monitoring.sh
./deploy-monitoring.sh
```

## Prometheus Configuration

### Scrape Targets

Prometheus is configured to scrape the following targets every 15 seconds:

| Job | Target | Metrics Path |
|-----|--------|-------------|
| prometheus | localhost:9090 | /metrics |
| kubernetes-nodes | Auto-discovered | /metrics |
| kubernetes-pods | Annotated pods | Custom |
| smartproperty-backend | backend:3000 | /api/metrics |
| smartproperty-frontend | frontend:80 | /stub_status |
| mongodb | mongodb:27017 | /metrics |
| redis | redis:6379 | /metrics |
| minio | minio:9000 | /minio/v2/metrics/cluster |

### Alert Rules

| Alert | Condition | Severity | Duration |
|-------|-----------|----------|----------|
| PodNotReady | Pod not ready | Warning | 2 min |
| PodRestartingFrequently | >3 restarts/hour | Warning | 1 min |
| HighCPUUsage | CPU > 80% | Warning | 5 min |
| HighMemoryUsage | Memory > 85% | Warning | 5 min |
| NodeDiskPressure | Disk pressure detected | Critical | 1 min |
| NodeNotReady | Node not ready | Critical | 2 min |
| TargetDown | Scrape target unreachable | Warning | 3 min |
| PVCAlmostFull | PVC > 85% full | Warning | 5 min |

## AlertManager Configuration

### Routing

- **Critical alerts**: Sent immediately (5s group wait)
- **Warning alerts**: Grouped and sent after 10s, repeated every 3 hours
- **Inhibition**: Critical alerts suppress matching warning alerts

### Receivers

Alerts are sent via webhook. In production, configure email/Slack:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts'
```

## Grafana Dashboard

A pre-provisioned **SmartProperty Overview** dashboard includes:

- Cluster node count
- Prometheus targets status (up/down)
- Active firing alerts
- Target status table
- Scrape duration graph
- Memory usage by pod (smartproperty namespace)
- CPU usage by pod (smartproperty namespace)

## Manifest Files

| File | Description |
|------|-------------|
| `namespace.yaml` | monitoring namespace |
| `prometheus-rbac.yaml` | ServiceAccount, ClusterRole, ClusterRoleBinding |
| `prometheus-config.yaml` | Prometheus scrape config + alert rules |
| `prometheus.yaml` | Deployment + ClusterIP + NodePort |
| `alertmanager-config.yaml` | AlertManager routing config |
| `alertmanager.yaml` | Deployment + ClusterIP + NodePort |
| `grafana.yaml` | ConfigMaps (datasources, dashboards) + Deployment + Services |
| `deploy-monitoring.sh` | Automated deployment script |

## Useful Commands

```bash
# Check monitoring pods
kubectl get pods -n monitoring

# View Prometheus logs
kubectl logs -l app=prometheus -n monitoring

# View AlertManager logs
kubectl logs -l app=alertmanager -n monitoring

# Reload Prometheus config
kubectl exec -it $(kubectl get pod -l app=prometheus -n monitoring -o jsonpath='{.items[0].metadata.name}') -n monitoring -- kill -HUP 1

# Check active alerts in Prometheus
# Go to http://<node-ip>:30900/alerts
```
