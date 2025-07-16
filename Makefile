# Motion MCP Server Makefile
# Build automation for development and production

# Project configuration
PROJECT_NAME = motion-mcp-server
NODE_VERSION = 20
MCP_BASE_PATH = src/api/mcp
ROUTES_MODULE_SUFFIX = -routes

# Include OpenAPI generation
include Makefile.openapi.mk

.PHONY: help install build clean test lint format dev run docker-build docker-run check setup openapi

# Default target
help:
	@echo "Motion MCP Server Build System"
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make build       - Build the project"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linter"
	@echo "  make format      - Format code"
	@echo "  make dev         - Start development server"
	@echo "  make run         - Run the built server"
	@echo "  make check       - Run all checks (lint, type, test)"
	@echo "  make setup       - Initial project setup"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo ""
	@echo "OpenAPI Generation:"
	@echo "  make openapi      - Generate all routes from schemas"
	@echo "  make v1-routes    - Generate v1 MCP routes"
	@echo "  make openapi-clean - Clean generated files"
	@echo "  make openapi-validate - Validate schemas"

# Installation
install:
	@echo "Installing dependencies..."
	npm ci

# Build
build: openapi
	@echo "Building project..."
	npm run build

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/.cache/
	npm run clean || true

# Testing
test:
	@echo "Running tests..."
	npm test

test-watch:
	@echo "Running tests in watch mode..."
	npm run test:watch

# Linting and formatting
lint:
	@echo "Running linter..."
	npm run lint

lint-fix:
	@echo "Running linter with auto-fix..."
	npm run lint:fix

format:
	@echo "Formatting code..."
	npm run format

format-check:
	@echo "Checking code formatting..."
	npm run format:check

# Type checking
typecheck:
	@echo "Running type check..."
	npm run typecheck

# Development
dev:
	@echo "Starting development server..."
	npm run dev

# Production
run:
	@echo "Running production server..."
	npm start

# Quality checks
check: lint typecheck test
	@echo "All checks completed successfully!"

# Initial setup
setup: install
	@echo "Setting up project..."
	@echo "Creating .claude directory structure..."
	mkdir -p .claude/motion/projects
	mkdir -p .claude/motion/tasks
	mkdir -p .claude/motion/sync
	@echo "Setup completed!"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t motion-mcp-server .

docker-build-dev:
	@echo "Building development Docker image..."
	docker build --target development -t motion-mcp-server:dev .

docker-run:
	@echo "Running Docker container..."
	docker run -it --rm \
		-v "${PWD}/.claude:/app/.claude" \
		-e MOTION_API_KEY="${MOTION_API_KEY}" \
		motion-mcp-server

docker-run-dev:
	@echo "Running development Docker container..."
	docker run -it --rm \
		-v "${PWD}:/app" \
		-v "${PWD}/.claude:/app/.claude" \
		-e MOTION_API_KEY="${MOTION_API_KEY}" \
		motion-mcp-server:dev

# Environment setup
env-example:
	@echo "Creating .env.example..."
	@echo "# Motion MCP Server Configuration" > .env.example
	@echo "MOTION_API_KEY=your_motion_api_key_here" >> .env.example
	@echo "MOTION_BASE_URL=https://api.usemotion.com/v1" >> .env.example
	@echo "MOTION_IS_TEAM_ACCOUNT=false" >> .env.example
	@echo "REQUEST_TIMEOUT=30000" >> .env.example
	@echo "CLAUDE_DATA_DIR=./.claude/motion" >> .env.example
	@echo ".env.example created"

# Development helpers
schema-validate:
	@echo "Validating YAML schemas..."
	@for file in src/schemas/mcp/*.yaml; do \
		echo "Validating $$file..."; \
		node -e "const yaml = require('js-yaml'); const fs = require('fs'); try { yaml.load(fs.readFileSync('$$file', 'utf8')); console.log('✓ Valid'); } catch(e) { console.log('✗ Invalid:', e.message); exit(1); }"; \
	done

schema-generate:
	@echo "Generating TypeScript types from schemas..."
	npm run schema:generate || echo "Schema generation not implemented yet"

# Git hooks
pre-commit: lint typecheck test
	@echo "Pre-commit checks passed!"

# Release
version-patch:
	npm version patch

version-minor:
	npm version minor

version-major:
	npm version major

# Documentation
docs:
	@echo "Generating documentation..."
	npm run docs || echo "Documentation generation not implemented yet"

# Monitor
logs:
	@echo "Showing logs..."
	docker logs motion-mcp-server || echo "Container not running"

# Utilities
size:
	@echo "Bundle size analysis..."
	npm run analyze || echo "Bundle analysis not implemented yet"

deps-check:
	@echo "Checking for outdated dependencies..."
	npm outdated

deps-update:
	@echo "Updating dependencies..."
	npm update

security-audit:
	@echo "Running security audit..."
	npm audit

# Debug
debug:
	@echo "Starting debug mode..."
	npm run debug || node --inspect dist/index.js

# OpenAPI route generation
v%-routes:
	$(MAKE) -f Makefile.openapi.mk $(MCP_BASE_PATH)/v$*-routes/.openapi-generator/FILES

# Generate all OpenAPI routes
openapi: $(patsubst schemas/mcp/v%,v%$(ROUTES_MODULE_SUFFIX),$(wildcard schemas/mcp/v*))
	@echo "✅ All OpenAPI routes generated"

# Force OpenAPI regeneration
openapi-force:
	@echo "Force regenerating OpenAPI routes..."
	@rm -rf $(MCP_BASE_PATH)/v*-routes/.openapi-generator
	$(MAKE) openapi