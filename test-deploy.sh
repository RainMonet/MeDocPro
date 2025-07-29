#!/bin/bash

# =============================================================================
# MeDocPro Docker Test Deployment Script
# Cross-platform testing deployment for local development
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="medocpro-test"

echo -e "${BLUE}🚀 MeDocPro Test Deployment${NC}"
echo "======================================"

# Detect platform and set Docker platform
detect_platform() {
    echo -e "${YELLOW}🔍 Detecting platform...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Check if it's Apple Silicon
        if [[ $(uname -m) == "arm64" ]]; then
            export DOCKER_PLATFORM="linux/arm64"
            echo -e "${GREEN}✅ Detected: macOS Apple Silicon (M1/M2)${NC}"
        else
            export DOCKER_PLATFORM="linux/amd64"
            echo -e "${GREEN}✅ Detected: macOS Intel${NC}"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        export DOCKER_PLATFORM="linux/amd64"
        echo -e "${GREEN}✅ Detected: Linux${NC}"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        export DOCKER_PLATFORM="linux/amd64"
        echo -e "${GREEN}✅ Detected: Windows${NC}"
    else
        export DOCKER_PLATFORM="linux/amd64"
        echo -e "${YELLOW}⚠️  Unknown platform, defaulting to linux/amd64${NC}"
    fi
}

# Check Docker installation
check_docker() {
    echo -e "${YELLOW}🐳 Checking Docker installation...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Please install Docker from https://docker.com/get-started"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        echo "Please install Docker Compose"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker and try again"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker is ready${NC}"
}

# Clean up previous deployment
cleanup_previous() {
    echo -e "${YELLOW}🧹 Cleaning up previous deployment...${NC}"
    
    # Stop and remove containers
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f &> /dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Build and start services
start_services() {
    echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
    echo "This may take several minutes on first run..."
    
    # Build with no cache to ensure fresh build
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    
    # Start services in detached mode
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# Wait for services to be healthy
wait_for_services() {
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -n "."
        
        # Check if all services are healthy
        local healthy_count=$(docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps --filter "status=running" --format "table {{.Name}}\t{{.Status}}" | grep -c "healthy\|Up" || true)
        
        if [ $healthy_count -ge 3 ]; then  # App, Postgres, Ollama
            echo ""
            echo -e "${GREEN}✅ All services are ready!${NC}"
            return 0
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo ""
    echo -e "${RED}❌ Timeout waiting for services to be ready${NC}"
    show_service_status
    exit 1
}

# Show service status
show_service_status() {
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    echo ""
}

# Perform health checks
health_checks() {
    echo -e "${YELLOW}🏥 Performing health checks...${NC}"
    
    local checks_passed=0
    local total_checks=4
    
    # Backend API health check
    if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend API${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ Backend API${NC}"
    fi
    
    # Frontend health check
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ Frontend${NC}"
    fi
    
    # Database health check
    if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T postgres pg_isready -U medocpro -d medocpro_test > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ Database${NC}"
    fi
    
    # Ollama health check
    if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama AI Service${NC}"
        checks_passed=$((checks_passed + 1))
    else
        echo -e "${RED}❌ Ollama AI Service${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Health Check Results: ${checks_passed}/${total_checks} services healthy${NC}"
    
    if [ $checks_passed -eq $total_checks ]; then
        return 0
    else
        return 1
    fi
}

# Show available AI models
show_ai_models() {
    echo -e "${YELLOW}🤖 Available AI Models:${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec ollama ollama list 2>/dev/null || echo "Could not retrieve model list"
    echo ""
}

# Show deployment summary
show_summary() {
    echo -e "${BLUE}🎉 MeDocPro Test Deployment Complete!${NC}"
    echo "=============================================="
    echo ""
    echo -e "${GREEN}📱 Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}🔧 Backend API:${NC} http://localhost:5000"
    echo -e "${GREEN}🗄️  Database:${NC} postgresql://medocpro:medocpro_dev_pass@localhost:5432/medocpro_test"
    echo -e "${GREEN}🤖 Ollama AI:${NC} http://localhost:11434"
    echo -e "${GREEN}📊 Redis:${NC} redis://localhost:6379"
    echo ""
    echo -e "${YELLOW}📋 Management Commands:${NC}"
    echo "• View logs: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo "• Stop services: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
    echo "• Restart services: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart"
    echo "• Service status: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps"
    echo ""
    echo -e "${GREEN}✨ Ready for testing!${NC}"
}

# Main execution
main() {
    detect_platform
    check_docker
    cleanup_previous
    start_services
    wait_for_services
    show_service_status
    
    if health_checks; then
        show_ai_models
        show_summary
    else
        echo -e "${RED}❌ Some services failed health checks${NC}"
        echo "Check logs with: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "stop")
        echo -e "${YELLOW}🛑 Stopping MeDocPro test deployment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
        echo -e "${GREEN}✅ Stopped${NC}"
        ;;
    "restart")
        echo -e "${YELLOW}🔄 Restarting MeDocPro test deployment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
        echo -e "${GREEN}✅ Restarted${NC}"
        ;;
    "logs")
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
        ;;
    "status")
        show_service_status
        health_checks
        ;;
    "clean")
        echo -e "${YELLOW}🧹 Performing deep clean...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Deep clean complete${NC}"
        ;;
    *)
        main
        ;;
esac