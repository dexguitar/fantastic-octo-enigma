#!/bin/bash

# Script to check the status of all services

NAMESPACE="document-processing"

echo "======================================"
echo "Kubernetes Deployment Status"
echo "======================================"
echo ""

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "Namespace '$NAMESPACE' does not exist. Please deploy first."
    exit 1
fi

echo "📦 Pods Status:"
kubectl get pods -n $NAMESPACE -o wide
echo ""

echo "🚀 Deployments Status:"
kubectl get deployments -n $NAMESPACE
echo ""

echo "🔧 Services:"
kubectl get services -n $NAMESPACE
echo ""

echo "💾 Persistent Volume Claims:"
kubectl get pvc -n $NAMESPACE
echo ""

echo "⚙️  ConfigMaps and Secrets:"
kubectl get configmaps,secrets -n $NAMESPACE
echo ""

echo "📊 Resource Usage:"
kubectl top pods -n $NAMESPACE 2>/dev/null || echo "Metrics not available (metrics-server not installed)"
echo ""

echo "🔍 Recent Events:"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10
echo ""

echo "======================================"
echo "Service Endpoints:"
echo "======================================"
echo "  API Gateway: http://localhost:30000"
echo "  API Docs: http://localhost:30000/api-docs"
echo "  Kafka UI: http://localhost:30080"
echo ""

echo "======================================"
echo "Quick Commands:"
echo "======================================"
echo "  View logs: ./k8s/utils/logs.sh"
echo "  Test API: ./k8s/utils/test-api.sh"
echo "  Shell access: ./k8s/utils/shell.sh"
echo "  Destroy: ./k8s/destroy.sh"
echo ""

