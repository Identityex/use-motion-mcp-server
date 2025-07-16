#!/usr/bin/env node

/**
 * Generate MCP route interfaces from OpenAPI schemas
 * This follows the work-stable-api pattern of generating directly into source
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

// Command line arguments
const schemaDir = process.argv[2] || 'schemas/mcp/v1';
const outputDir = process.argv[3] || 'src/api/mcp/v1-routes';

// Load and compile templates
const routeTemplate = fs.readFileSync(
  path.join(__dirname, '../schemas/api-gen/server/mcp-route.mustache'),
  'utf8'
);
const toolsTemplate = fs.readFileSync(
  path.join(__dirname, '../schemas/api-gen/server/mcp-tools.mustache'),
  'utf8'
);
const modelTemplate = fs.readFileSync(
  path.join(__dirname, '../schemas/api-gen/server/model.mustache'),
  'utf8'
);

const routeCompiler = Handlebars.compile(routeTemplate);
const toolsCompiler = Handlebars.compile(toolsTemplate);
const modelCompiler = Handlebars.compile(modelTemplate);

// Register Handlebars helpers
Handlebars.registerHelper('camelCase', (str) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
});

Handlebars.registerHelper('pascalCase', (str) => {
  const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1);
});

// hasMore is handled by passing it as a property in the data

// Load API specification
const apiPath = path.join(schemaDir, 'api.yaml');
const api = yaml.load(fs.readFileSync(apiPath, 'utf8'));

// Load component schemas
const componentsDir = path.join(schemaDir, 'components');
if (fs.existsSync(componentsDir)) {
  const componentFiles = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.yaml'));
  
  if (!api.components) api.components = {};
  if (!api.components.schemas) api.components.schemas = {};
  
  componentFiles.forEach(file => {
    const content = yaml.load(fs.readFileSync(path.join(componentsDir, file), 'utf8'));
    Object.assign(api.components.schemas, content);
  });
}

// Load route files
const routeFiles = fs.readdirSync(schemaDir)
  .filter(f => f.endsWith('.yaml') && f !== 'api.yaml');

routeFiles.forEach(file => {
  const content = yaml.load(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
  if (content.paths) {
    if (!api.paths) api.paths = {};
    Object.assign(api.paths, content.paths);
  }
});

// Helper function to map OpenAPI types to TypeScript
function mapSchemaTypeToTS(schema) {
  if (schema.type === 'string') {
    return schema.enum ? schema.enum.map(v => `'${v}'`).join(' | ') : 'string';
  }
  if (schema.type === 'number' || schema.type === 'integer') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') return `Array<${mapSchemaTypeToTS(schema.items)}>`;
  if (schema.type === 'object') return 'Record<string, any>';
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    // Map ID types and other simple types to string
    if (refName.endsWith('ID') || refName === 'Timestamp') {
      return 'string';
    }
    // Map Priority and Status enums inline
    if (refName === 'Priority') {
      return "'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'";
    }
    if (refName === 'Status' || refName === 'TaskStatus') {
      return "'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'";
    }
    return refName;
  }
  return 'any';
}

// Resolve schema references
function resolveSchemaRef(prop, api) {
  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop();
    return api.components?.schemas?.[refName] || prop;
  }
  return prop;
}

// Group operations by tag/controller
const controllers = {};

Object.entries(api.paths || {}).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, operation]) => {
    if (operation['x-mcp-tool']) {
      const tool = operation['x-mcp-tool'];
      const controllerName = tool.controller || 'Default';
      
      if (!controllers[controllerName]) {
        controllers[controllerName] = {
          name: controllerName,
          operations: []
        };
      }
      
      // Extract parameters
      const parameters = [];
      if (operation.requestBody?.content?.['application/json']?.schema) {
        const schema = operation.requestBody.content['application/json'].schema;
        if (schema.$ref) {
          const refName = schema.$ref.split('/').pop();
          const refSchema = api.components.schemas[refName];
          if (refSchema && refSchema.properties) {
            Object.entries(refSchema.properties).forEach(([name, prop]) => {
              const resolvedProp = resolveSchemaRef(prop, api);
              parameters.push({
                name,
                type: mapSchemaTypeToTS(resolvedProp),
                required: refSchema.required?.includes(name) || false,
                description: resolvedProp.description || '',
                schemaType: resolvedProp.type || 'string',
                enum: resolvedProp.enum,
                minimum: resolvedProp.minimum,
                maximum: resolvedProp.maximum,
                default: resolvedProp.default,
                schema: resolvedProp
              });
            });
          }
        }
      }
      
      // Extract tool name from path (e.g., /tools/motion.project.list -> motion.project.list)
      const toolName = path.replace('/tools/', '');
      
      controllers[controllerName].operations.push({
        operationId: operation.operationId,
        name: toolName,
        method: method.toUpperCase(),
        path,
        summary: operation.summary,
        description: operation.description,
        parameters,
        responses: operation.responses,
        mcpTool: tool
      });
    }
  });
});

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, 'routes'), { recursive: true });
fs.mkdirSync(path.join(outputDir, 'models'), { recursive: true });

// Generate route files for each controller
Object.values(controllers).forEach(controller => {
  const routeData = {
    controllerName: controller.name,
    operations: controller.operations,
    imports: extractImports(controller.operations, api)
  };
  
  const routeContent = routeCompiler(routeData);
  const fileName = `${controller.name}Routes.ts`;
  fs.writeFileSync(path.join(outputDir, 'routes', fileName), routeContent);
  console.log(`✅ Generated ${fileName}`);
});

// Generate tools index
const toolsData = {
  controllers: Object.values(controllers).map(controller => ({
    ...controller,
    operations: controller.operations.map(op => {
      const requiredParams = op.parameters.filter(p => p.required);
      return {
        ...op,
        parameters: op.parameters.map((param, index, array) => ({
          ...param,
          hasMore: index < array.length - 1
        })),
        requiredParams: requiredParams.map((param, index, array) => ({
          ...param,
          hasMore: index < array.length - 1
        }))
      };
    })
  }))
};
const toolsContent = toolsCompiler(toolsData);
fs.writeFileSync(path.join(outputDir, 'tools.ts'), toolsContent);

// Generate models
generateModels(api.components?.schemas || {}, path.join(outputDir, 'models'));

// Generate index files
generateIndexFiles(outputDir, Object.keys(controllers));

console.log('✅ MCP route generation complete');

// Helper functions
function extractImports(operations, api) {
  const imports = new Set();
  
  operations.forEach(op => {
    op.parameters.forEach(param => {
      if (param.schema.$ref) {
        const modelName = param.schema.$ref.split('/').pop();
        imports.add(modelName);
      }
    });
  });
  
  return Array.from(imports);
}

function generateModels(schemas, modelsDir) {
  // Skip simple ID types and types we map inline
  const skipTypes = ['ProjectID', 'TaskID', 'WorkspaceID', 'UserID', 'Timestamp', 'Priority', 'Status', 'TaskStatus'];
  
  Object.entries(schemas).forEach(([name, schema]) => {
    if (skipTypes.includes(name)) {
      return; // Skip these types
    }
    
    const modelData = prepareModelData(name, schema, schemas);
    const modelContent = modelCompiler(modelData);
    fs.writeFileSync(path.join(modelsDir, `${name}.ts`), modelContent);
  });
  
  // Generate index excluding skipped types
  const indexContent = Object.keys(schemas)
    .filter(name => !skipTypes.includes(name))
    .map(name => `export * from './${name}';`)
    .join('\n');
  fs.writeFileSync(path.join(modelsDir, 'index.ts'), indexContent);
}

function prepareModelData(name, schema, allSchemas) {
  const imports = new Set();
  const properties = [];
  
  // Check if it's an enum
  if (schema.enum) {
    return {
      modelName: name,
      isEnum: true,
      enumValues: schema.enum.map((value, index) => ({
        value,
        hasMore: index < schema.enum.length - 1
      }))
    };
  }
  
  // Check if it's a type alias (e.g., string, number)
  if (schema.type && !schema.properties) {
    let aliasType = schema.type;
    if (schema.type === 'string' && schema.format === 'date-time') {
      aliasType = 'string'; // ISO date string
    }
    return {
      modelName: name,
      isAlias: true,
      aliasType: aliasType === 'integer' ? 'number' : aliasType
    };
  }
  
  // Process properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([propName, prop]) => {
      const required = schema.required?.includes(propName) || false;
      let type = '';
      
      // Check if type references another model
      if (prop.$ref) {
        const refName = prop.$ref.split('/').pop();
        // Only add to imports if it's not a simple type we map inline
        if (!['ProjectID', 'TaskID', 'WorkspaceID', 'UserID', 'Timestamp', 'Priority', 'Status', 'TaskStatus'].includes(refName)) {
          imports.add(refName);
        }
        type = mapSchemaTypeToTS(prop);
      } else if (prop.type === 'array' && prop.items?.$ref) {
        // Check for array items that reference models
        const refName = prop.items.$ref.split('/').pop();
        if (!['ProjectID', 'TaskID', 'WorkspaceID', 'UserID', 'Timestamp', 'Priority', 'Status', 'TaskStatus'].includes(refName)) {
          imports.add(refName);
        }
        type = `Array<${mapSchemaTypeToTS(prop.items)}>`;
      } else {
        // Map basic types
        type = mapSchemaTypeToTS(prop);
      }
      
      properties.push({
        name: propName,
        type,
        required,
        description: prop.description
      });
    });
  }
  
  return {
    modelName: name,
    isEnum: false,
    isAlias: false,
    imports: imports.size > 0 ? Array.from(imports).join(', ') : null,
    properties
  };
}

function generateIndexFiles(outputDir, controllerNames) {
  // Routes index
  const routesIndex = controllerNames
    .map(name => `export * from './${name}Routes';`)
    .join('\n');
  fs.writeFileSync(path.join(outputDir, 'routes', 'index.ts'), routesIndex);
  
  // Main index
  const mainIndex = `// Generated MCP Routes
export * from './routes';
export * from './models';
export * from './tools';
`;
  fs.writeFileSync(path.join(outputDir, 'index.ts'), mainIndex);
}