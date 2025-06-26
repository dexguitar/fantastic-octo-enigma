#!/bin/bash

# Docker Compose helper script for Document Processing System

case "$1" in
  start)
    echo "Starting Document Processing System using Docker Compose..."
    docker-compose up -d
    echo "Services started!"
    echo "API Gateway: http://localhost:3000"
    echo "API Documentation: http://localhost:3000/api-docs"
    echo "Kafka UI: http://localhost:8080"
    ;;
    
  stop)
    echo "Stopping Document Processing System..."
    docker-compose down
    echo "Services stopped!"
    ;;
    
  restart)
    echo "Restarting Document Processing System..."
    docker-compose down
    docker-compose up -d
    echo "Services restarted!"
    echo "API Gateway: http://localhost:3000"
    echo "API Documentation: http://localhost:3000/api-docs"
    echo "Kafka UI: http://localhost:8080"
    ;;
    
  logs)
    if [ "$2" ]; then
      echo "Showing logs for $2 service..."
      docker-compose logs -f "$2"
    else
      echo "Showing logs for all services..."
      docker-compose logs -f
    fi
    ;;
    
  build)
    echo "Building Docker images..."
    docker-compose build
    echo "Build complete!"
    ;;
    
  clean)
    echo "Cleaning up Docker resources..."
    docker-compose down -v
    echo "Cleanup complete!"
    ;;
    
  *)
    echo "Usage: $0 {start|stop|restart|logs|build|clean}"
    echo ""
    echo "Commands:"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  restart - Restart all services"
    echo "  logs    - Show logs (use 'logs service-name' for specific service)"
    echo "  build   - Build or rebuild services"
    echo "  clean   - Stop services and remove volumes"
    exit 1
    ;;
esac

exit 0 