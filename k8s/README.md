# SmartProperty - Kubernetes Deployment

## Architecture

SmartProperty is deployed on a **kubeadm** cluster with 2 nodes:

| Node | Role | IP |
|------|------|----|
| k8s-master | Control Plane | 192.168.175.131 |
| k8s-worker1 | Worker | 192.168.175.134 |

All resources are deployed in the `smartproperty` namespace.

## Components

### Infrastructure Services

| Service | Image | Replicas | Storage |
|---------|-------|----------|---------|
| MongoDB | mongo:7.0 | 1 | 5Gi PVC |
| Redis | redis:7.2-alpine | 1 | - |
| MinIO | minio/minio:latest | 1 | 5Gi PVC |
| MailHog | mailhog/mailhog:v1.0.1 | 1 | - |
| Mongo Express | mongo-express:1.0.2 | 1 | - |

### Application Services

| Service | Image | Replicas |
|---------|-------|----------|
| Backend (NestJS) | smartproperty-backend:latest | 2 |
| Frontend (React/Nginx) | smartproperty-frontend:latest | 2 |

## Manifest Files

| File | Description |
|------|-------------|
| `namespace.yaml` | Creates the `smartproperty` namespace |
| `secrets.yaml` | Stores credentials (MongoDB, Redis, JWT, MinIO, OAuth, VAPID) |
| `configmap.yaml` | Non-sensitive config for backend, frontend, and ai-services |
| `mongodb.yaml` | PersistentVolumeClaim + Deployment + ClusterIP Service |
| `redis.yaml` | Deployment + ClusterIP Service |
| `minio.yaml` | PersistentVolumeClaim + Deployment + ClusterIP + NodePort Service |
| `mailhog.yaml` | Deployment + ClusterIP + NodePort Service |
| `mongo-express.yaml` | Deployment + NodePort Service (MongoDB web UI) |
| `backend.yaml` | Deployment (2 replicas) + ClusterIP + NodePort Service |
| `frontend.yaml` | Deployment (2 replicas) + ClusterIP + NodePort Service |
| `ai-services.yaml` | Deployment + ClusterIP Service |
| `deploy.sh` | Automated deployment script |

## Networking

### Service Types

- **ClusterIP**: Internal services accessible only within the cluster (MongoDB, Redis)
- **NodePort**: Services exposed externally via node IP + port

### Access URLs

| Service | URL | NodePort |
|---------|-----|----------|
| Frontend | http://\<node-ip\>:30080 | 30080 |
| Backend API | http://\<node-ip\>:30000/api | 30000 |
| MinIO API | http://\<node-ip\>:30090 | 30090 |
| MinIO Console | http://\<node-ip\>:30091 | 30091 |
| Mongo Express | http://\<node-ip\>:30081 | 30081 |
| MailHog Web UI | http://\<node-ip\>:30025 | 30025 |

## Prerequisites

### Cluster Setup

1. **2 VMs** running Ubuntu 22.04+ with:
   - Swap disabled (`sudo swapoff -a`)
   - Firewall disabled (`sudo ufw disable`)
   - containerd installed and configured with `SystemdCgroup = true`
   - kubeadm, kubelet, kubectl v1.29 installed

2. **Master node** initialized with:
   ```bash
   sudo kubeadm init --pod-network-cidr=10.244.0.0/16
   ```

3. **Flannel CNI** installed for pod networking:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
   ```

4. **local-path-provisioner** installed for PersistentVolume support:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml
   kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
   ```

5. **Worker node** joined to the cluster:
   ```bash
   sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
   ```

### Docker Images

Custom images must be built and imported on **all nodes**:

```bash
# Build on dev machine
docker build -t smartproperty-backend:latest -f backend/Dockerfile ./backend
docker build -t smartproperty-frontend:latest --target prod \
  --build-arg VITE_RECAPTCHA_SITE_KEY=<key> \
  --build-arg VITE_API_URL=/api \
  -f frontend/Dockerfile ./frontend

# Save as tar
docker save smartproperty-backend:latest -o smartproperty-backend.tar
docker save smartproperty-frontend:latest -o smartproperty-frontend.tar

# Transfer to each node via scp
scp smartproperty-backend.tar smartproperty-frontend.tar user@<node-ip>:/tmp/

# Import on each node
sudo ctr -n k8s.io images import /tmp/smartproperty-backend.tar
sudo ctr -n k8s.io images import /tmp/smartproperty-frontend.tar
```

## Deployment

### Automated Deployment

```bash
cd k8s/
chmod +x deploy.sh
./deploy.sh
```

The script deploys resources in order:
1. Namespace
2. Secrets and ConfigMaps
3. MongoDB (with PVC)
4. Redis
5. MinIO (with PVC)
6. MailHog
7. Backend (waits for MongoDB to be ready)
8. Frontend

### Manual Deployment

```bash
kubectl apply -f namespace.yaml
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f mongodb.yaml
kubectl apply -f redis.yaml
kubectl apply -f minio.yaml
kubectl apply -f mailhog.yaml

# Wait for infrastructure
kubectl wait --for=condition=ready pod -l app=mongodb -n smartproperty --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n smartproperty --timeout=60s

kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f mongo-express.yaml
```

## Health Checks

### Readiness & Liveness Probes

| Service | Probe Type | Endpoint | Initial Delay |
|---------|-----------|----------|---------------|
| MongoDB | Readiness (exec) | `mongosh --eval db.adminCommand('ping')` | 15s |
| MinIO | Readiness (HTTP) | `/minio/health/ready` :9000 | 10s |
| Backend | Readiness + Liveness (HTTP) | `/api` :3000 | 15s / 30s |
| Frontend | Readiness + Liveness (HTTP) | `/` :80 | 5s / 10s |

## Resource Limits

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|------------|-----------|---------------|-------------|
| MongoDB | 250m | 500m | 256Mi | 512Mi |
| Redis | 100m | 250m | 64Mi | 128Mi |
| MinIO | 100m | 250m | 128Mi | 256Mi |
| MailHog | 50m | 100m | 32Mi | 64Mi |
| Backend | 250m | 500m | 256Mi | 512Mi |
| Frontend | 50m | 100m | 64Mi | 128Mi |

## Useful Commands

```bash
# Check cluster status
kubectl get nodes
kubectl get pods -n smartproperty
kubectl get svc -n smartproperty

# View pod logs
kubectl logs -l app=backend -n smartproperty --tail=50
kubectl logs -l app=frontend -n smartproperty --tail=50

# Describe a pod (events, env vars, probes)
kubectl describe pod <pod-name> -n smartproperty

# Execute command inside a pod
kubectl exec -it <pod-name> -n smartproperty -- /bin/sh

# Scale a deployment
kubectl scale deployment backend --replicas=3 -n smartproperty

# Delete and redeploy
kubectl delete namespace smartproperty
./deploy.sh
```

## Secrets Management

Secrets are stored in `secrets.yaml` using `stringData` (base64 encoding handled by Kubernetes). In production, use:
- Kubernetes Sealed Secrets
- HashiCorp Vault
- External Secrets Operator

**Never commit real credentials to git.** The `secrets.yaml` in this repo contains development-only credentials.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PVC stuck in Pending | Install local-path-provisioner (see Prerequisites) |
| ImagePullBackOff | Import images with `ctr -n k8s.io images import` on all nodes |
| DNS resolution fails | Disable firewall: `sudo ufw disable` on all nodes |
| MongoDB readiness timeout | Increase `timeoutSeconds` in readiness probe |
| Nginx "host not found" for backend | Use resolver directive with CoreDNS IP in nginx.conf |
| Worker node NotReady | Check swap (`sudo swapoff -a`) and kubelet (`sudo systemctl restart kubelet`) |
| Disk pressure taint | Free disk space or expand VM disk (`sudo growpart`, `sudo resize2fs`) |
