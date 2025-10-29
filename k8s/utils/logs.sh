#!/bin/bash

# Script to view logs from different services

NAMESPACE="document-processing"

echo "Available services:"
echo "  1. API Gateway"
echo "  2. Image Service"
echo "  3. Text Service"
echo "  4. PostgreSQL"
echo "  5. Kafka"
echo "  6. Zookeeper"
echo "  7. Kafka UI"
echo "  8. All Services"
echo ""
read -p "Select service (1-8): " choice

case $choice in
  1)
    kubectl logs -n $NAMESPACE -l app=api-gateway -f --tail=100
    ;;
  2)
    kubectl logs -n $NAMESPACE -l app=image-service -f --tail=100
    ;;
  3)
    kubectl logs -n $NAMESPACE -l app=text-service -f --tail=100
    ;;
  4)
    kubectl logs -n $NAMESPACE -l app=postgres -f --tail=100
    ;;
  5)
    kubectl logs -n $NAMESPACE -l app=kafka -f --tail=100
    ;;
  6)
    kubectl logs -n $NAMESPACE -l app=zookeeper -f --tail=100
    ;;
  7)
    kubectl logs -n $NAMESPACE -l app=kafka-ui -f --tail=100
    ;;
  8)
    kubectl logs -n $NAMESPACE --all-containers=true -f --tail=50
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

