#!/bin/bash

# Docker setup script for Document Processing System

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check Docker and Docker Compose
check_docker() {
  echo -e "${YELLOW}Checking Docker installation...${NC}"
  
  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
  fi
  
  # Check if Docker is running
  if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
    exit 1
  fi
  
  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
  fi
  
  echo -e "${GREEN}Docker and Docker Compose are installed and running.${NC}"
}

# Function to create environment file
create_env_file() {
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# API Gateway Configuration
API_PORT=3000
API_HOST=0.0.0.0

# Kafka Configuration
KAFKA_CLIENT_ID=document-processor
KAFKA_BROKERS=kafka:9092
KAFKA_GROUP_ID=document-processing-group

# Kafka Topics
TOPIC_IMAGE_PROCESSING=document-image-processing
TOPIC_TEXT_PROCESSING=document-text-processing
TOPIC_PROCESSING_RESULTS=document-processing-results

# Service Configuration
NODE_ENV=development
EOF
    echo -e "${GREEN}.env file created!${NC}"
  else
    echo -e "${YELLOW}.env file already exists. Skipping...${NC}"
  fi
}

# Function to create logs directory
create_logs_dir() {
  if [ ! -d logs ]; then
    echo -e "${YELLOW}Creating logs directory...${NC}"
    mkdir -p logs
    echo -e "${GREEN}Logs directory created!${NC}"
  else
    echo -e "${YELLOW}Logs directory already exists. Skipping...${NC}"
  fi
}

# Main script execution
case "$1" in
  init)
    echo -e "${GREEN}Initializing Docker environment for Document Processing System...${NC}"
    check_docker
    create_env_file
    create_logs_dir
    echo -e "${GREEN}Initialization complete!${NC}"
    echo ""
    echo "You can now start the services with:"
    echo "./docker-run.sh start    # For production"
    echo "./docker-dev.sh start    # For development"
    ;;
    
  prod)
    echo -e "${GREEN}Setting up production environment...${NC}"
    check_docker
    create_env_file
    create_logs_dir
    
    echo -e "${YELLOW}Building production Docker images...${NC}"
    docker-compose build
    
    echo -e "${GREEN}Production setup complete!${NC}"
    echo ""
    echo "You can now start the production services with:"
    echo "./docker-run.sh start"
    ;;
    
  dev)
    echo -e "${GREEN}Setting up development environment...${NC}"
    check_docker
    create_env_file
    create_logs_dir
    
    echo -e "${YELLOW}Building development Docker images...${NC}"
    docker-compose -f docker-compose.dev.yml build
    
    echo -e "${GREEN}Development setup complete!${NC}"
    echo ""
    echo "You can now start the development services with:"
    echo "./docker-dev.sh start"
    ;;
    
  *)
    echo -e "${GREEN}Document Processing System - Docker Setup${NC}"
    echo ""
    echo "Usage: $0 {init|prod|dev}"
    echo ""
    echo "Commands:"
    echo "  init   - Initialize Docker environment (check requirements, create .env file)"
    echo "  prod   - Set up production environment"
    echo "  dev    - Set up development environment"
    exit 1
    ;;
esac

exit 0 