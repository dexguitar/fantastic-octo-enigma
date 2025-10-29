# Kubernetes Deployment Files

This directory contains all Kubernetes manifests and deployment scripts for the Document Processing System.

## 🚀 Quick Start

### Prerequisites

- Local Kubernetes cluster (Docker Desktop, Minikube, or Kind)
- kubectl installed
- Docker installed

### Deploy in 2 Steps

```bash
# 1. Make scripts executable (first time only)
chmod +x deploy.sh destroy.sh utils/*.sh

# 2. Deploy everything
./deploy.sh
```

That's it! The script will:

- Build the Docker image
- Create namespace and resources
- Deploy PostgreSQL, Kafka, and all services
- Run database migrations
- Wait for everything to be ready

### Access Services

- **API Gateway**: http://localhost:30000
- **API Documentation**: http://localhost:30000/api-docs
- **Kafka UI**: http://localhost:30080

## 📁 Directory Structure

```
k8s/
├── deploy.sh                    # Main deployment script
├── destroy.sh                   # Cleanup script
├── kustomization.yaml           # Kustomize configuration
├── namespace.yaml               # Kubernetes namespace
├── configmap.yaml               # Application configuration
├── secret.yaml                  # Sensitive data
│
├── postgres/                    # PostgreSQL manifests
│   ├── postgres-pvc.yaml
│   ├── postgres-deployment.yaml
│   ├── postgres-service.yaml
│   └── postgres-init-configmap.yaml
│
├── zookeeper/                   # Zookeeper manifests
│   ├── zookeeper-pvc.yaml
│   ├── zookeeper-deployment.yaml
│   └── zookeeper-service.yaml
│
├── kafka/                       # Kafka manifests
│   ├── kafka-pvc.yaml
│   ├── kafka-deployment.yaml
│   └── kafka-service.yaml
│
├── kafka-ui/                    # Kafka UI manifests
│   ├── kafka-ui-deployment.yaml
│   └── kafka-ui-service.yaml
│
├── api-gateway/                 # API Gateway manifests
│   ├── api-gateway-deployment.yaml
│   └── api-gateway-service.yaml
│
├── image-service/               # Image Service manifests
│   ├── image-service-deployment.yaml
│   └── image-service-service.yaml
│
├── text-service/                # Text Service manifests
│   ├── text-service-deployment.yaml
│   └── text-service-service.yaml
│
├── jobs/                        # Kubernetes Jobs
│   └── db-migration-job.yaml   # Database migration job
│
└── utils/                       # Utility scripts
    ├── logs.sh                  # View service logs
    ├── status.sh                # Check deployment status
    ├── shell.sh                 # Access pod shells
    └── test-api.sh              # Test API endpoints
```

## 🛠️ Utility Scripts

### Check Deployment Status

```bash
./utils/status.sh
```

Shows:

- Pod status
- Deployment status
- Services
- PVCs
- Recent events
- Resource usage

### View Logs

```bash
./utils/logs.sh
```

Interactive menu to view logs from:

- API Gateway
- Image Service
- Text Service
- PostgreSQL
- Kafka
- Zookeeper
- All services

### Access Pod Shell

```bash
./utils/shell.sh
```

Interactive menu to:

- Get shell access to pods
- Access PostgreSQL database directly
- Execute commands in containers

### Test API

```bash
./utils/test-api.sh
```

Automated tests for:

- Health check
- Create document
- Get documents
- Update document
- Delete document

## 📝 Common Commands

### Deployment

```bash
# Deploy everything
./deploy.sh

# Deploy using kubectl
kubectl apply -k .

# Deploy specific component
kubectl apply -f postgres/
```

### Monitoring

```bash
# Get all resources
kubectl get all -n document-processing

# Watch pods
kubectl get pods -n document-processing -w

# View logs
kubectl logs -n document-processing -l app=api-gateway -f

# Check events
kubectl get events -n document-processing --sort-by='.lastTimestamp'
```

### Scaling

```bash
# Scale API Gateway
kubectl scale deployment api-gateway -n document-processing --replicas=3

# Auto-scale (requires metrics-server)
kubectl autoscale deployment api-gateway -n document-processing --cpu-percent=70 --min=2 --max=10
```

### Updating

```bash
# Rebuild and update
docker build -t document-processing-app:latest ..
kind load docker-image document-processing-app:latest  # If using Kind
kubectl rollout restart deployment/api-gateway -n document-processing

# Watch rollout
kubectl rollout status deployment/api-gateway -n document-processing
```

### Cleanup

```bash
# Delete everything
./destroy.sh

# Delete namespace only
kubectl delete namespace document-processing

# Delete specific resources
kubectl delete deployment api-gateway -n document-processing
```

## 🔧 Configuration

### ConfigMap (`configmap.yaml`)

- Environment variables
- Application settings
- Kafka configuration
- Database connection settings

### Secret (`secret.yaml`)

- Database credentials
- Sensitive configuration

**Note**: For production, use proper secret management solutions like:

- Sealed Secrets
- External Secrets Operator
- Vault

### Resource Limits

Each deployment has resource limits defined:

```yaml
resources:
  requests:
    memory: '256Mi'
    cpu: '250m'
  limits:
    memory: '512Mi'
    cpu: '500m'
```

Adjust these based on your needs in the respective deployment files.

## 🐛 Troubleshooting

### Pods not starting?

```bash
# Check pod status
kubectl get pods -n document-processing

# Describe pod to see events
kubectl describe pod <pod-name> -n document-processing

# Check logs
kubectl logs <pod-name> -n document-processing
```

### Image not found?

```bash
# Build image
docker build -t document-processing-app:latest ..

# For Kind
kind load docker-image document-processing-app:latest

# For Minikube
eval $(minikube docker-env)
docker build -t document-processing-app:latest ..
```

### Service not accessible?

```bash
# Check if service is running
kubectl get svc -n document-processing

# Check if pods are ready
kubectl get pods -n document-processing

# For Minikube
minikube service api-gateway -n document-processing
```

### Database connection issues?

```bash
# Check PostgreSQL pod
kubectl get pods -n document-processing -l app=postgres

# View PostgreSQL logs
kubectl logs -n document-processing -l app=postgres

# Test connection
kubectl run -it --rm postgres-test --image=postgres:15-alpine -n document-processing -- \
  psql postgresql://admin:admin123@postgres:5432/document_processing
```

## 📊 Architecture

### Network Architecture

- **ClusterIP Services**: Internal communication between services
- **NodePort Services**: External access (API Gateway on 30000, Kafka UI on 30080)

### Storage Architecture

- **PersistentVolumeClaims**:
  - PostgreSQL: 5Gi
  - Kafka: 5Gi
  - Zookeeper Data: 2Gi
  - Zookeeper Log: 1Gi

### High Availability

- API Gateway: 2 replicas
- Image Service: 2 replicas
- Text Service: 2 replicas
- PostgreSQL: 1 replica (single instance)
- Kafka: 1 replica (single instance)

**Note**: For production, consider:

- PostgreSQL replication/HA (e.g., using operators)
- Multi-broker Kafka cluster
- Network policies for security
- Ingress controller for routing

## 🚀 Production Considerations

Before deploying to production:

1. **Security**
   - Use proper secret management
   - Enable RBAC
   - Set up network policies
   - Use TLS/SSL

2. **High Availability**
   - Multi-replica databases
   - Multi-broker Kafka
   - Pod disruption budgets
   - Node affinity/anti-affinity

3. **Monitoring**
   - Prometheus for metrics
   - Grafana for visualization
   - ELK or Loki for logs
   - Alerting

4. **Backup**
   - Database backups
   - PVC snapshots
   - Disaster recovery plan

5. **CI/CD**
   - GitOps (ArgoCD/Flux)
   - Automated testing
   - Canary deployments
   - Blue-green deployments

## 📚 Additional Resources

- [Main Deployment Guide](../K8S_DEPLOYMENT.md) - Detailed documentation
- [Docker Compose](../docker-compose.yml) - Alternative deployment
- [API Documentation](http://localhost:30000/api-docs) - After deployment

## 💡 Tips

- Use `kubectl -n document-processing` for all commands to avoid typing namespace each time, or set it as default:

  ```bash
  kubectl config set-context --current --namespace=document-processing
  ```

- Create an alias for kubectl:

  ```bash
  alias k=kubectl
  ```

- Use `watch` to monitor resources:

  ```bash
  watch kubectl get pods -n document-processing
  ```

- Use `stern` for better log viewing:
  ```bash
  brew install stern
  stern -n document-processing .
  ```

## 🤝 Support

For issues or questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review logs using `./utils/logs.sh`
3. Check deployment status with `./utils/status.sh`
4. Refer to the [main documentation](../K8S_DEPLOYMENT.md)
