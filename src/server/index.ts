#!/usr/bin/env node

// Motion MCP Server Entry Point
// Follows the work-stable-api pattern: Controller > App > Services

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { createDependencies, Config } from '../setup/dependencies';
import { MCPTools } from '../api/mcp/v1-routes/tools';
import { MCPToolResponse } from '../api/mcp/v1-routes/models';
import * as schemas from '../services/validation/request-schemas';
import { z } from 'zod';
import { logger, createRequestLogger } from '../services/utils/logger';

// Load environment configuration
import * as dotenv from 'dotenv';
dotenv.config();

function loadConfig(): Config {
  const apiKey = process.env.MOTION_API_KEY;
  if (!apiKey) {
    throw new Error('MOTION_API_KEY environment variable is required');
  }

  return {
    motion: {
      apiKey,
      baseUrl: process.env.MOTION_BASE_URL,
      workspaceId: process.env.MOTION_WORKSPACE_ID,
    },
    ai: {
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || 'gpt-4o-mini',
    },
  };
}

class MotionMCPServer {
  private readonly server: Server;
  private readonly dependencies: ReturnType<typeof createDependencies>;

  constructor() {
    logger.info('Starting Motion MCP Server');
    
    const config = loadConfig();
    logger.info('Configuration loaded', {
      hasMotionApiKey: !!config.motion.apiKey,
      hasAIKey: !!(config.ai && config.ai.apiKey),
    });

    // Create all dependencies with proper wiring
    this.dependencies = createDependencies(config);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'motion-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    logger.info('Server initialized successfully');
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: MCPTools, // Use generated tools from OpenAPI
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const controllers = this.dependencies.controllers;
      
      // Generate request ID for tracking
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const reqLogger = createRequestLogger(name, requestId);
      
      reqLogger.info('Tool request received', {
        args: args ? Object.keys(args) : [],
      });

      try {
        let response: MCPToolResponse;
        
        // Validate and parse arguments based on tool name
        const validatedArgs = this.validateToolArguments(name, args || {});
        
        // Map tool names to controller methods with validated arguments
        const toolMap: Record<string, () => Promise<MCPToolResponse>> = {
          // Project tools
          'motion.project.list': () => controllers.projectController.listProjects(validatedArgs),
          'motion.project.create': () => controllers.projectController.createProject(validatedArgs),
          'motion.project.bind': () => controllers.projectController.bindProject(validatedArgs),
          'motion.project.sync': () => controllers.projectController.syncProject(validatedArgs),
          
          // Task tools
          'motion.task.create': () => controllers.taskController.createTask(validatedArgs),
          'motion.task.batch_create': () => controllers.taskController.batchCreateTasks(validatedArgs),
          'motion.task.list': () => controllers.taskController.listTasks(validatedArgs),
          'motion.task.search': () => controllers.taskController.searchTasks(validatedArgs),
          'motion.task.update': () => controllers.taskController.updateTask(validatedArgs),
          'motion.task.complete': () => controllers.taskController.completeTask(validatedArgs),
          'motion.task.move': () => controllers.taskController.moveTask(validatedArgs),
          'motion.task.enrich': () => controllers.taskController.enrichTask(validatedArgs),
          'motion.task.analyze': () => controllers.taskController.analyzeTask(validatedArgs),
          
          // Workflow tools
          'motion.workflow.plan': () => controllers.workflowController.planWorkflow(validatedArgs),
          
          // Sync tools
          'motion.sync.all': () => controllers.syncController.syncAll(validatedArgs),
          'motion.sync.check': () => controllers.syncController.checkSync(validatedArgs),
          
          // Context tools
          'motion.context.save': () => controllers.contextController.saveContext(validatedArgs),
          'motion.context.load': () => controllers.contextController.loadContext(validatedArgs),
          
          // Docs tools
          'motion.docs.create': () => controllers.docsController.createDocs(validatedArgs),
          'motion.docs.update': () => controllers.docsController.updateDocs(validatedArgs),
          'motion.status.report': () => controllers.docsController.generateStatusReport(validatedArgs),
        };
        
        const handler = toolMap[name];
        if (!handler) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        response = await handler();
        
        reqLogger.info('Tool request completed successfully', {
          hasError: response.isError || false,
        });
        
        // MCP SDK expects content directly, not wrapped in MCPToolResponse
        return {
          content: response.content,
        };
      } catch (error) {
        reqLogger.error('Tool request failed', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
          } : String(error),
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validateToolArguments(toolName: string, args: unknown): any {
    try {
      // Map tool names to their validation schemas
      const schemaMap: Record<string, z.ZodSchema> = {
        // Project tools
        'motion.project.list': schemas.listProjectsRequestSchema,
        'motion.project.create': schemas.createProjectRequestSchema,
        'motion.project.bind': schemas.bindProjectRequestSchema,
        'motion.project.sync': schemas.syncProjectRequestSchema,
        
        // Task tools
        'motion.task.create': schemas.createTaskRequestSchema,
        'motion.task.batch_create': schemas.batchCreateTasksRequestSchema,
        'motion.task.list': schemas.listTasksRequestSchema,
        'motion.task.search': schemas.searchTasksRequestSchema,
        'motion.task.update': schemas.updateTaskRequestSchema,
        'motion.task.complete': schemas.completeTaskRequestSchema,
        'motion.task.move': schemas.moveTaskRequestSchema,
        'motion.task.enrich': schemas.enrichTaskRequestSchema,
        'motion.task.analyze': schemas.analyzeTaskRequestSchema,
        
        // Workflow tools
        'motion.workflow.plan': schemas.planWorkflowRequestSchema,
        
        // Sync tools
        'motion.sync.all': schemas.syncAllRequestSchema,
        'motion.sync.check': schemas.checkSyncRequestSchema,
        
        // Context tools
        'motion.context.save': schemas.saveContextRequestSchema,
        'motion.context.load': schemas.loadContextRequestSchema,
        
        // Docs tools
        'motion.docs.create': schemas.createDocsRequestSchema,
        'motion.docs.update': schemas.updateDocsRequestSchema,
        'motion.status.report': schemas.statusReportRequestSchema,
      };
      
      const schema = schemaMap[toolName];
      if (!schema) {
        throw new McpError(ErrorCode.InvalidRequest, `No validation schema for tool: ${toolName}`);
      }
      
      // Parse and validate the arguments
      const result = schema.safeParse(args);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${errors}`);
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InvalidParams, `Validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Motion MCP Server running on stdio');
  }
}

// Main entry point
const server = new MotionMCPServer();
server.run().catch((error) => {
  logger.error('Fatal error', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
  });
  process.exit(1);
});