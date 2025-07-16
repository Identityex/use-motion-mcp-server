#!/bin/bash

# Motion MCP Server Docker Build Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Building Motion MCP Server Docker Image${NC}"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from template...${NC}"
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        echo -e "${YELLOW}Please edit .env file with your Motion API key before running${NC}"
    fi
fi

# Default values
IMAGE_NAME="motion-mcp-server"
VERSION="latest"
BUILD_TYPE="production"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            BUILD_TYPE="development"
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
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dev          Build development image"
            echo "  --tag VERSION  Set image tag (default: latest)"
            echo "  --name NAME    Set image name (default: motion-mcp-server)"
            echo "  -h, --help     Show this help"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

cd "$PROJECT_DIR"

if [ "$BUILD_TYPE" = "development" ]; then
    echo -e "${GREEN}Building development image...${NC}"
    docker build \
        -f Dockerfile.dev \
        -t "${IMAGE_NAME}:${VERSION}-dev" \
        .
    echo -e "${GREEN}Development image built: ${IMAGE_NAME}:${VERSION}-dev${NC}"
else
    echo -e "${GREEN}Building production image...${NC}"
    docker build \
        -f Dockerfile \
        -t "${IMAGE_NAME}:${VERSION}" \
        .
    echo -e "${GREEN}Production image built: ${IMAGE_NAME}:${VERSION}${NC}"
fi

echo -e "${GREEN}Build completed successfully!${NC}"

# Show next steps
echo -e "\n${YELLOW}Next steps:${NC}"
if [ "$BUILD_TYPE" = "development" ]; then
    echo "  Run development container: ./scripts/docker-run.sh --dev"
    echo "  Or use docker-compose: docker-compose -f docker-compose.dev.yml up"
else
    echo "  Run production container: ./scripts/docker-run.sh"
    echo "  Or use docker-compose: docker-compose up"
fi

echo "  Check logs: docker logs motion-mcp-server"
echo "  Stop container: docker stop motion-mcp-server"