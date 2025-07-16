# OpenAPI Generation Makefile
# Generates MCP routes and types from OpenAPI schemas
# Based on work-stable-api patterns

# Configuration
OPENAPI_GENERATOR = npx @openapitools/openapi-generator-cli
SCHEMAS_DIR = schemas/mcp
TEMPLATE_DIR = schemas/api-gen/server
SCRIPTS_DIR = scripts

# Ensure MCP_BASE_PATH is set
MCP_BASE_PATH ?= src/api/mcp

# OpenAPI generation rule
$(MCP_BASE_PATH)/v%-routes/.openapi-generator/FILES: \
	$(SCHEMAS_DIR)/v%/api.yaml \
	$(wildcard $(SCHEMAS_DIR)/v%/*.yaml) \
	$(wildcard $(SCHEMAS_DIR)/v%/components/*.yaml) \
	$(wildcard $(TEMPLATE_DIR)/*.mustache) \
	$(SCRIPTS_DIR)/generate-mcp-server.sh
	@echo "Generating MCP v$* routes..."
	@mkdir -p $(MCP_BASE_PATH)/v$*-routes
	@$(SCRIPTS_DIR)/generate-mcp-server.sh \
		$(SCHEMAS_DIR)/v$*/api.yaml \
		$(MCP_BASE_PATH)/v$*-routes \
		$(TEMPLATE_DIR)
	@echo "✅ Generated MCP v$* routes"

# Clean generated files
openapi-clean:
	@echo "Cleaning generated OpenAPI files..."
	@rm -rf $(MCP_BASE_PATH)/v*-routes/.openapi-generator
	@rm -rf $(MCP_BASE_PATH)/v*-routes/routes
	@rm -rf $(MCP_BASE_PATH)/v*-routes/models
	@find $(MCP_BASE_PATH)/v*-routes -name "*.ts" -type f -delete 2>/dev/null || true
	@echo "✅ OpenAPI files cleaned"

# Validate OpenAPI schemas
openapi-validate:
	@echo "Validating OpenAPI schemas..."
	@for version in $(wildcard $(SCHEMAS_DIR)/v*); do \
		echo "Validating $$version..."; \
		$(OPENAPI_GENERATOR) validate -i $$version/api.yaml || exit 1; \
	done
	@echo "✅ All OpenAPI schemas are valid"

# Watch for schema changes
openapi-watch:
	@echo "Watching for OpenAPI schema changes..."
	@nodemon --watch $(SCHEMAS_DIR) --watch $(TEMPLATE_DIR) --ext yaml,mustache --exec "make openapi"

# Generate TypeScript client (for testing)
openapi-client:
	@echo "Generating TypeScript client..."
	@for version in $(wildcard $(SCHEMAS_DIR)/v*); do \
		v=$$(basename $$version); \
		echo "Generating $$v client..."; \
		$(OPENAPI_GENERATOR) generate \
			-i $$version/api.yaml \
			-g typescript-axios \
			-o dist/client/$$v \
			--skip-validate-spec; \
	done
	@echo "✅ TypeScript client generated"

.PHONY: openapi-clean openapi-validate openapi-watch openapi-client