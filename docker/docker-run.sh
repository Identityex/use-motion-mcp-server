#!/bin/bash

# Motion MCP Server Docker Run Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Running Motion MCP Server Docker Container${NC}"

# Default values
IMAGE_NAME="motion-mcp-server"
VERSION="latest"
CONTAINER_NAME="motion-mcp-server"
RUN_TYPE="production"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            RUN_TYPE="development"
            CONTAINER_NAME="motion-mcp-server-dev"
            shift
            ;;
        --tag)
            VERSION="$2"
            shift 2
            ;;
        --name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --container-name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -d|--detach)
            DETACH="-d"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dev                 Run development container"
            echo "  --tag VERSION         Use specific image tag (default: latest)"
            echo "  --name NAME           Use specific image name (default: motion-mcp-server)"
            echo "  --container-name NAME Set container name"
            echo "  -d, --detach          Run in background"
            echo "  -h, --help            Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file with your Motion API key${NC}"
    echo -e "${YELLOW}You can copy from .env.example and modify it${NC}"
    exit 1
fi

# Stop existing container if running
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping existing container: ${CONTAINER_NAME}${NC}"
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

# Set image tag based on run type
if [ "$RUN_TYPE" = "development" ]; then
    FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}-dev"
    echo -e "${GREEN}Running development container...${NC}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"
    echo -e "${GREEN}Running production container...${NC}"
fi

# Check if image exists
if ! docker image inspect "$FULL_IMAGE_NAME" >/dev/null 2>&1; then
    echo -e "${RED}Error: Image $FULL_IMAGE_NAME not found${NC}"
    echo -e "${YELLOW}Please build the image first: ./scripts/docker-build.sh${NC}"
    if [ "$RUN_TYPE" = "development" ]; then
        echo -e "${YELLOW}For development: ./scripts/docker-build.sh --dev${NC}"
    fi
    exit 1
fi

# Create volume for data persistence
docker volume create motion-mcp-data >/dev/null 2>&1 || true

# Run the container
if [ "$RUN_TYPE" = "development" ]; then
    docker run \
        ${DETACH} \
        --name "$CONTAINER_NAME" \
        --env-file .env \
        -e NODE_ENV=development \
        -e LOG_LEVEL=debug \
        -v "$(pwd):/app" \
        -v "/app/node_modules" \
        -v "motion-mcp-data:/app/.claude/motion" \
        -p 3000:3000 \
        --restart unless-stopped \
        "$FULL_IMAGE_NAME"
else
    docker run \
        ${DETACH} \
        --name "$CONTAINER_NAME" \
        --env-file .env \
        -e NODE_ENV=production \
        -v "motion-mcp-data:/app/.claude/motion" \
        --restart unless-stopped \
        "$FULL_IMAGE_NAME"
fi

if [ -n "$DETACH" ]; then
    echo -e "${GREEN}Container started in background: ${CONTAINER_NAME}${NC}"
    echo -e "\n${YELLOW}Useful commands:${NC}"
    echo "  View logs: docker logs -f $CONTAINER_NAME"
    echo "  Stop container: docker stop $CONTAINER_NAME"
    echo "  Restart: docker restart $CONTAINER_NAME"
    echo "  Shell access: docker exec -it $CONTAINER_NAME sh"
else
    echo -e "${GREEN}Container started: ${CONTAINER_NAME}${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
fi