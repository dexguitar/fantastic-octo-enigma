#!/bin/bash

set -e

echo "======================================"
echo "Destroying Kubernetes Deployment"
echo "======================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} kubectl is not installed."
    exit 1
fi

read -p "Are you sure you want to delete all resources in the document-processing namespace? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Aborted."
    exit 0
fi

print_warning "Deleting all resources in document-processing namespace..."

kubectl delete namespace document-processing --ignore-not-found=true

print_info "Waiting for namespace to be deleted..."
kubectl wait --for=delete namespace/document-processing --timeout=120s || true

echo ""
echo "======================================"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo "======================================"
echo ""

