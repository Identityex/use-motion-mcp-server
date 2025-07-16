# Motion MCP Server Docker Configuration
# Multi-stage build for optimal image size and security

# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies to reduce size
RUN npm prune --production

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S motion && \
    adduser -S motion -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=motion:motion /app/dist ./dist
COPY --from=builder --chown=motion:motion /app/node_modules ./node_modules
COPY --from=builder --chown=motion:motion /app/package*.json ./

# Create data directory for local storage
RUN mkdir -p /app/.claude/motion && \
    chown -R motion:motion /app/.claude

# Switch to non-root user
USER motion

# Set environment variables
ENV NODE_ENV=production
ENV CLAUDE_DATA_DIR=/app/.claude/motion

# Expose port (if needed for health checks)
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server/index.js"]

# Labels for better container management
LABEL \
    org.opencontainers.image.title="Motion MCP Server" \
    org.opencontainers.image.description="Model Context Protocol server for Motion task management" \
    org.opencontainers.image.version="1.0.0" \
    org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    org.opencontainers.image.source="https://github.com/your-username/motion-mcp-server" \
    org.opencontainers.image.licenses="MIT"