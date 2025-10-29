#!/bin/bash

# Script to get shell access to pods

NAMESPACE="document-processing"

echo "Available services:"
echo "  1. API Gateway"
echo "  2. Image Service"
echo "  3. Text Service"
echo "  4. PostgreSQL"
echo "  5. Kafka"
echo "  6. Zookeeper"
echo ""
read -p "Select service (1-6): " choice

case $choice in
  1)
    POD=$(kubectl get pods -n $NAMESPACE -l app=api-gateway -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -it -n $NAMESPACE $POD -- /bin/sh
    ;;
  2)
    POD=$(kubectl get pods -n $NAMESPACE -l app=image-service -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -it -n $NAMESPACE $POD -- /bin/sh
    ;;
  3)
    POD=$(kubectl get pods -n $NAMESPACE -l app=text-service -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -it -n $NAMESPACE $POD -- /bin/sh
    ;;
  4)
    POD=$(kubectl get pods -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')
    echo "Connecting to PostgreSQL..."
    kubectl exec -it -n $NAMESPACE $POD -- psql -U admin -d document_processing
    ;;
  5)
    POD=$(kubectl get pods -n $NAMESPACE -l app=kafka -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -it -n $NAMESPACE $POD -- /bin/bash
    ;;
  6)
    POD=$(kubectl get pods -n $NAMESPACE -l app=zookeeper -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -it -n $NAMESPACE $POD -- /bin/bash
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

