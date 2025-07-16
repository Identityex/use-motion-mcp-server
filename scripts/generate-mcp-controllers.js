#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const yaml = require('js-yaml');

// Load and compile Handlebars template
const templatePath = path.join(__dirname, '../schemas/api-gen/server/controller.mustache');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = Handlebars.compile(templateSource);

// Load and compile controller-types template
const controllerTypesPath = path.join(__dirname, '../schemas/api-gen/server/controller-types.mustache');
const controllerTypesSource = fs.readFileSync(controllerTypesPath, 'utf8');

// Load OpenAPI schema
const schemaPath = path.join(__dirname, '../schemas/mcp/v1/generated/openapi.yaml');
const schema = yaml.load(fs.readFileSync(schemaPath, 'utf8'));

// Output directory
const outputDir = path.join(__dirname, '../src/generated/controllers');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate controller-types file first
const controllerTypesOutput = path.join(outputDir, 'controller-types.ts');
fs.writeFileSync(controllerTypesOutput, controllerTypesSource);
console.log(`✅ Generated: ${controllerTypesOutput}`);

// Group operations by controller
const controllerMap = new Map();

for (const [pathKey, pathItem] of Object.entries(schema.paths || {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (method === 'post' && operation['x-mcp-tool']) {
      const mcpTool = operation['x-mcp-tool'];
      const controllerName = mcpTool.controller;
      
      if (!controllerMap.has(controllerName)) {
        controllerMap.set(controllerName, {
          classname: controllerName,
          classFilename: controllerName.replace('Controller', '').toLowerCase() + '-controller',
          description: `${controllerName} operations`,
          operations: []
        });
      }
      
      const controller = controllerMap.get(controllerName);
      controller.operations.push({
        operationId: operation.operationId,
        operationIdCamelCase: operation.operationId,
        summary: operation.summary,
        'x-mcp-tool': {
          action: mcpTool.action,
          validation: mcpTool.validation || {}
        }
      });
    }
  }
}

// Generate controllers
for (const [controllerName, controllerData] of controllerMap) {
  const templateData = {
    ...controllerData,
    operations: [{
      operation: controllerData.operations
    }],
    imports: [
      { classname: 'ServiceDependencies', filename: './controller-types' },
      { classname: 'MCPToolHandler', filename: './controller-types' },
      { classname: 'withValidation', filename: './controller-types' },
      { classname: 'withErrorHandling', filename: './controller-types' }
    ]
  };

  const generatedCode = template(templateData);
  const filename = `${controllerData.classFilename}.ts`;
  const outputPath = path.join(outputDir, filename);
  
  fs.writeFileSync(outputPath, generatedCode);
  console.log(`✅ Generated: ${outputPath}`);
}

// Generate index file
const indexContent = Array.from(controllerMap.values())
  .map(controller => `export * from './${controller.classFilename}';`)
  .join('\n') + '\nexport * from \'./controller-types\';\n';

fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
console.log(`✅ Generated: ${path.join(outputDir, 'index.ts')}`);

console.log(`🎉 Generated ${controllerMap.size} MCP controllers with FRP patterns!`);