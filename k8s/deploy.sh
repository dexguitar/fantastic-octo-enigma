#!/bin/bash

set -e

echo "======================================"
echo "Deploying to Kubernetes"
echo "======================================"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    print_error "Kubernetes cluster is not accessible. Please start your local Kubernetes cluster."
    echo "Options:"
    echo "  - Docker Desktop: Enable Kubernetes in Docker Desktop settings"
    echo "  - Minikube: Run 'minikube start'"
    echo "  - Kind: Run 'kind create cluster'"
    exit 1
fi

print_info "Kubernetes cluster is accessible"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

print_info "Building Docker image..."
docker build -t document-processing-app:latest "$PROJECT_ROOT"

if kubectl config current-context | grep -q "kind"; then
    print_info "Detected Kind cluster. Loading image..."
    kind load docker-image document-processing-app:latest
fi

if kubectl config current-context | grep -q "minikube"; then
    print_info "Detected Minikube cluster. Loading image..."
    minikube image load document-processing-app:latest
fi

if kubectl config current-context | grep -q "colima"; then
    print_info "Detected Colima cluster. Image already available in Colima's Docker."
fi

print_info "Creating namespace..."
kubectl apply -f "$SCRIPT_DIR/namespace.yaml"

print_info "Applying ConfigMaps and Secrets..."
kubectl apply -f "$SCRIPT_DIR/configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/secret.yaml"

print_info "Deploying PostgreSQL..."
kubectl apply -f "$SCRIPT_DIR/postgres/postgres-init-configmap.yaml"
kubectl apply -f "$SCRIPT_DIR/postgres/postgres-pvc.yaml"
kubectl apply -f "$SCRIPT_DIR/postgres/postgres-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/postgres/postgres-service.yaml"

print_info "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n document-processing

print_info "Running database migrations..."
kubectl apply -f "$SCRIPT_DIR/jobs/db-migration-job.yaml"
print_info "Waiting for migration job to complete..."
kubectl wait --for=condition=complete --timeout=60s job/db-migration -n document-processing || {
    print_error "Database migration failed. Check logs:"
    kubectl logs -n document-processing job/db-migration
    exit 1
}
print_info "Database migrations completed successfully"

print_info "Deploying Zookeeper..."
kubectl apply -f "$SCRIPT_DIR/zookeeper/zookeeper-pvc.yaml"
kubectl apply -f "$SCRIPT_DIR/zookeeper/zookeeper-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/zookeeper/zookeeper-service.yaml"

print_info "Waiting for Zookeeper to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/zookeeper -n document-processing

print_info "Deploying Kafka..."
kubectl apply -f "$SCRIPT_DIR/kafka/kafka-pvc.yaml"
kubectl apply -f "$SCRIPT_DIR/kafka/kafka-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/kafka/kafka-service.yaml"

print_info "Waiting for Kafka to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/kafka -n document-processing

print_info "Deploying Kafka UI..."
kubectl apply -f "$SCRIPT_DIR/kafka-ui/kafka-ui-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/kafka-ui/kafka-ui-service.yaml"

print_info "Deploying API Gateway..."
kubectl apply -f "$SCRIPT_DIR/api-gateway/api-gateway-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/api-gateway/api-gateway-service.yaml"

print_info "Deploying Image Service..."
kubectl apply -f "$SCRIPT_DIR/image-service/image-service-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/image-service/image-service-service.yaml"

print_info "Deploying Text Service..."
kubectl apply -f "$SCRIPT_DIR/text-service/text-service-deployment.yaml"
kubectl apply -f "$SCRIPT_DIR/text-service/text-service-service.yaml"

print_info "Waiting for all services to be ready..."
kubectl wait --for=condition=available --timeout=100s deployment/api-gateway -n document-processing || print_warning "API Gateway deployment timeout"
kubectl wait --for=condition=available --timeout=100s deployment/image-service -n document-processing || print_warning "Image Service deployment timeout"
kubectl wait --for=condition=available --timeout=100s deployment/text-service -n document-processing || print_warning "Text Service deployment timeout"
kubectl wait --for=condition=available --timeout=100s deployment/kafka-ui -n document-processing || print_warning "Kafka UI deployment timeout"

echo ""
echo "======================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Services are accessible at:"
echo "  - API Gateway: http://localhost:30000"
echo "  - API Documentation: http://localhost:30000/api-docs"
echo "  - Kafka UI: http://localhost:30080"
echo ""
echo "To view all resources:"
echo "  kubectl get all -n document-processing"
echo ""
echo "To view logs:"
echo "  kubectl logs -n document-processing -l app=api-gateway -f"
echo ""
echo "To delete the deployment:"
echo "  ./k8s/destroy.sh"
echo ""

