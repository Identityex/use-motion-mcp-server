# Docker Configuration

This document covers Docker deployment options for the Motion MCP Server.

## Quick Start

### Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- Motion API Key

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your Motion API key
nano .env
```

### 2. Production Deployment

```bash
# Using Docker Compose (Recommended)
docker-compose up -d

# Or using build scripts
./scripts/docker-build.sh
./scripts/docker-run.sh -d
```

### 3. Development Environment

```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up

# Or using build scripts
./scripts/docker-build.sh --dev
./scripts/docker-run.sh --dev
```

## Configuration Options

### Environment Variables

Configure the container using environment variables in `.env`:

```bash
# Required
MOTION_API_KEY=your_api_key_here

# Optional
MOTION_IS_TEAM_ACCOUNT=false
MOTION_BASE_URL=https://api.usemotion.com/v1
MCP_SERVER_NAME=motion
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
```

### Volume Mounting

The container uses volumes for data persistence:

- **Production**: `motion_data:/app/.claude/motion`
- **Development**: `motion_dev_data:/app/.claude/motion` + source code mount

## Deployment Scenarios

### 1. Production with Docker Compose

**File**: `docker-compose.yml`

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d
```

### 2. Development with Hot Reload

**File**: `docker-compose.dev.yml`

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# The container will watch for file changes and restart automatically
```

### 3. Standalone Container

```bash
# Build image
docker build -t motion-mcp-server .

# Run container
docker run -d \
  --name motion-mcp-server \
  --env-file .env \
  -v motion_data:/app/.claude/motion \
  --restart unless-stopped \
  motion-mcp-server
```

## Container Management

### Health Checks

All containers include health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect motion-mcp-server | jq '.[0].State.Health'
```

### Logging

Containers use JSON file logging with rotation:

```bash
# View logs
docker logs -f motion-mcp-server

# View specific number of lines
docker logs --tail 100 motion-mcp-server

# Follow logs with timestamps
docker logs -f -t motion-mcp-server
```

### Shell Access

Access container shell for debugging:

```bash
# Production container
docker exec -it motion-mcp-server sh

# Development container
docker exec -it motion-mcp-server-dev sh
```

## Build Scripts

### docker-build.sh

Build container images with various options:

```bash
# Production build
./scripts/docker-build.sh

# Development build
./scripts/docker-build.sh --dev

# Custom tag
./scripts/docker-build.sh --tag v1.2.0

# Custom name
./scripts/docker-build.sh --name my-motion-server
```

### docker-run.sh

Run containers with various configurations:

```bash
# Production (foreground)
./scripts/docker-run.sh

# Production (background)
./scripts/docker-run.sh -d

# Development
./scripts/docker-run.sh --dev

# Custom container name
./scripts/docker-run.sh --container-name my-container
```

## Multi-Stage Build

The production Dockerfile uses multi-stage builds for optimization:

1. **Builder Stage**: Installs dependencies and builds the application
2. **Production Stage**: Creates minimal runtime image

Benefits:
- Smaller final image size
- Improved security (no build tools in production)
- Faster deployment

## Security Features

### Non-Root User

All containers run as non-root user `motion` (UID 1001):

```dockerfile
RUN addgroup -g 1001 -S motion && \
    adduser -S motion -u 1001
USER motion
```

### Minimal Base Image

Uses Alpine Linux for smaller attack surface:

```dockerfile
FROM node:18-alpine
```

### Resource Limits

Docker Compose includes resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.1'
      memory: 128M
```

## Troubleshooting

### Common Issues

1. **Container fails to start**
   ```bash
   # Check logs
   docker logs motion-mcp-server
   
   # Verify environment
   docker exec motion-mcp-server env
   ```

2. **Permission errors**
   ```bash
   # Check file ownership
   docker exec motion-mcp-server ls -la /app/.claude/motion
   
   # Fix permissions if needed
   docker exec -u root motion-mcp-server chown -R motion:motion /app/.claude
   ```

3. **Network connectivity**
   ```bash
   # Test Motion API connectivity
   docker exec motion-mcp-server wget -qO- https://api.usemotion.com/v1/users/me
   ```

4. **Data persistence**
   ```bash
   # Check volume
   docker volume inspect motion_data
   
   # Backup data
   docker run --rm -v motion_data:/data -v $(pwd):/backup alpine tar czf /backup/motion_backup.tar.gz -C /data .
   ```

### Performance Monitoring

Monitor container performance:

```bash
# Resource usage
docker stats motion-mcp-server

# System resource usage
docker system df

# Container processes
docker exec motion-mcp-server ps aux
```

## Best Practices

### 1. Production Deployment

- Use Docker Compose for orchestration
- Set resource limits
- Configure log rotation
- Use secrets management for API keys
- Regular image updates
- Monitor container health

### 2. Development

- Use development compose file
- Mount source code for live reload
- Enable debug logging
- Use development-specific environment variables

### 3. Maintenance

- Regular image updates: `docker-compose pull`
- Monitor disk usage: `docker system prune`
- Backup persistent data regularly
- Review logs for errors

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t motion-mcp-server .
      
      - name: Run tests
        run: docker run --rm motion-mcp-server npm test
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          docker tag motion-mcp-server ${{ secrets.REGISTRY }}/motion-mcp-server:latest
          docker push ${{ secrets.REGISTRY }}/motion-mcp-server:latest
```

## Advanced Configuration

### Custom Network

Create custom Docker network:

```bash
# Create network
docker network create motion-network

# Run with custom network
docker run --network motion-network motion-mcp-server
```

### External Database

For advanced deployments with external Redis cache:

```yaml
version: '3.8'
services:
  motion-mcp-server:
    image: motion-mcp-server
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```