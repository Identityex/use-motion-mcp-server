#!/bin/bash
# Generate MCP server routes from OpenAPI specification
# Based on work-stable-api patterns

set -euo pipefail

# Arguments
INPUT_SPEC=$1
OUTPUT_DIR=$2
TEMPLATE_DIR=$3

# Get directory of the input spec
SPEC_DIR=$(dirname "$INPUT_SPEC")

# Run the Node.js generation script
echo "Generating MCP routes from OpenAPI schemas..."
node scripts/generate-mcp-routes.js "$SPEC_DIR" "$OUTPUT_DIR"

# Create .openapi-generator directory to track generation
mkdir -p "$OUTPUT_DIR/.openapi-generator"
echo "Generated at $(date)" > "$OUTPUT_DIR/.openapi-generator/FILES"

echo "✅ MCP server generation complete"