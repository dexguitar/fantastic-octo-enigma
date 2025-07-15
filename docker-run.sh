#!/bin/bash

# Docker Compose helper script for Document Processing System
# Updated to use 'docker compose' instead of 'docker-compose' for newer Docker versions

# Function to check if docker compose is available
check_docker_compose() {
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif docker-compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        echo "Error: Neither 'docker compose' nor 'docker-compose' is available"
        exit 1
    fi
}

# Initialize Docker Compose command
check_docker_compose

case "$1" in
  start)
    echo "Starting Document Processing System using Docker Compose..."
    $DOCKER_COMPOSE_CMD up -d
    echo "Services started!"
    echo "API Gateway: http://localhost:3000"
    echo "API Documentation: http://localhost:3000/api-docs"
    echo "Kafka UI: http://localhost:8080"
    ;;
    
  stop)
    echo "Stopping Document Processing System..."
    $DOCKER_COMPOSE_CMD down
    echo "Services stopped!"
    ;;
    
  restart)
    echo "Restarting Document Processing System..."
    $DOCKER_COMPOSE_CMD down
    $DOCKER_COMPOSE_CMD up -d
    echo "Services restarted!"
    echo "API Gateway: http://localhost:3000"
    echo "API Documentation: http://localhost:3000/api-docs"
    echo "Kafka UI: http://localhost:8080"
    ;;
    
  logs)
    if [ "$2" ]; then
      echo "Showing logs for $2 service..."
      $DOCKER_COMPOSE_CMD logs -f "$2"
    else
      echo "Showing logs for all services..."
      $DOCKER_COMPOSE_CMD logs -f
    fi
    ;;
    
  build)
    echo "Building Docker images..."
    $DOCKER_COMPOSE_CMD build
    echo "Build complete!"
    ;;
    
  clean)
    echo "Cleaning up Docker resources..."
    $DOCKER_COMPOSE_CMD down -v
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