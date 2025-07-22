#!/usr/bin/env ts-node

// Motion MCP Server Entry Point
// Follows the work-stable-api pattern: Controller > App > Services

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import * as http from 'http';
import * as url from 'url';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { z } from 'zod';
import { MCPToolResponse } from '../api/mcp/v1-routes/models/index.js';
import { MCPTools } from '../api/mcp/v1-routes/tools.js';
import { createRequestLogger, logger } from '../services/utils/logger.js';
import * as schemas from '../services/validation/request-schemas.js';
import { Config, createDependencies } from '../setup/dependencies.js';

// Load environment configuration
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

function loadConfig(): Config {
  const apiKey = process.env.MOTION_API_KEY;
  const workspaceId = process.env.MOTION_WORKSPACE_ID;
  const baseUrl = process.env.MOTION_BASE_URL;
  
  // Debug logging for environment variables
  logger.info('Debug: Environment variables', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    workspaceId: workspaceId ? `${workspaceId.substring(0, 8)}...` : 'undefined',
    baseUrl: baseUrl || 'undefined',
    envKeys: Object.keys(process.env).filter(key => key.startsWith('MOTION_')).length
  });
  
  if (!apiKey) {
    throw new Error('MOTION_API_KEY environment variable is required');
  }

  return {
    motion: {
      apiKey,
      baseUrl,
      workspaceId,
    },
    ai: {
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || 'gpt-4o-mini',
    },
  };
}

class MotionMCPServer {
  private readonly server: Server;
  private dependencies?: Awaited<ReturnType<typeof createDependencies>>;

  constructor() {
    logger.info('Starting Motion MCP Server');
    
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
  }

  async initialize(): Promise<void> {
    const config = loadConfig();
    logger.info('Configuration loaded', {
      hasMotionApiKey: !!config.motion.apiKey,
      hasAIKey: !!(config.ai && config.ai.apiKey),
    });

    // Create all dependencies with proper wiring
    this.dependencies = await createDependencies(config);

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
      
      if (!this.dependencies) {
        throw new McpError(ErrorCode.InternalError, 'Server not properly initialized');
      }
      
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
          'motion_project_list': () => controllers.projectController.listProjects(validatedArgs),
          'motion_project_create': () => controllers.projectController.createProject(validatedArgs),
          'motion_project_bind': () => controllers.projectController.bindProject(validatedArgs),
          'motion_project_sync': () => controllers.projectController.syncProject(validatedArgs),
          
          // Task tools
          'motion_task_create': () => controllers.taskController.createTask(validatedArgs),
          'motion_task_batch_create': () => controllers.taskController.batchCreateTasks(validatedArgs),
          'motion_task_list': () => controllers.taskController.listTasks(validatedArgs),
          'motion_task_search': () => controllers.taskController.searchTasks(validatedArgs),
          'motion_task_update': () => controllers.taskController.updateTask(validatedArgs),
          'motion_task_complete': () => controllers.taskController.completeTask(validatedArgs),
          'motion_task_move': () => controllers.taskController.moveTask(validatedArgs),
          'motion_task_enrich': () => controllers.taskController.enrichTask(validatedArgs),
          'motion_task_analyze': () => controllers.taskController.analyzeTask(validatedArgs),
          
          // Workflow tools
          'motion_workflow_plan': () => controllers.workflowController.planWorkflow(validatedArgs),
          
          // Sync tools
          'motion_sync_all': () => controllers.syncController.syncAll(validatedArgs),
          'motion_sync_check': () => controllers.syncController.checkSync(validatedArgs),
          
          // Context tools
          'motion_context_save': () => controllers.contextController.saveContext(validatedArgs),
          'motion_context_load': () => controllers.contextController.loadContext(validatedArgs),
          
          // Docs tools
          'motion_docs_create': () => controllers.docsController.createDocs(validatedArgs),
          'motion_docs_update': () => controllers.docsController.updateDocs(validatedArgs),
          'motion_status_report': () => controllers.docsController.generateStatusReport(validatedArgs),
          
          // Workspace tools
          'motion_workspace_list': () => controllers.workspaceController.listWorkspaces(validatedArgs),
          'motion_workspace_set_default': () => controllers.workspaceController.setDefaultWorkspace(validatedArgs),
          'motion_workspace_get_settings': () => controllers.workspaceController.getWorkspaceSettings(validatedArgs),
          'motion_workspace_update_settings': () => controllers.workspaceController.updateWorkspaceSettings(validatedArgs),
        };
        
        const handler = toolMap[name];
        if (!handler) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        response = await handler();
        
        reqLogger.info('Tool request completed', {
          hasError: response.isError || false,
        });
        
        // MCP SDK expects content directly, not wrapped in MCPToolResponse
        return {
          content: response.content,
          isError: response.isError,
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
        'motion_project_list': schemas.listProjectsRequestSchema,
        'motion_project_create': schemas.createProjectRequestSchema,
        'motion_project_bind': schemas.bindProjectRequestSchema,
        'motion_project_sync': schemas.syncProjectRequestSchema,
        
        // Task tools
        'motion_task_create': schemas.createTaskRequestSchema,
        'motion_task_batch_create': schemas.batchCreateTasksRequestSchema,
        'motion_task_list': schemas.listTasksRequestSchema,
        'motion_task_search': schemas.searchTasksRequestSchema,
        'motion_task_update': schemas.updateTaskRequestSchema,
        'motion_task_complete': schemas.completeTaskRequestSchema,
        'motion_task_move': schemas.moveTaskRequestSchema,
        'motion_task_enrich': schemas.enrichTaskRequestSchema,
        'motion_task_analyze': schemas.analyzeTaskRequestSchema,
        
        // Workflow tools
        'motion_workflow_plan': schemas.planWorkflowRequestSchema,
        
        // Sync tools
        'motion_sync_all': schemas.syncAllRequestSchema,
        'motion_sync_check': schemas.checkSyncRequestSchema,
        
        // Context tools
        'motion_context_save': schemas.saveContextRequestSchema,
        'motion_context_load': schemas.loadContextRequestSchema,
        
        // Docs tools
        'motion_docs_create': schemas.createDocsRequestSchema,
        'motion_docs_update': schemas.updateDocsRequestSchema,
        'motion_status_report': schemas.statusReportRequestSchema,
        
        // Workspace tools
        'motion_workspace_list': schemas.listWorkspacesRequestSchema,
        'motion_workspace_set_default': schemas.setDefaultWorkspaceRequestSchema,
        'motion_workspace_get_settings': schemas.getWorkspaceSettingsRequestSchema,
        'motion_workspace_update_settings': schemas.updateWorkspaceSettingsRequestSchema,
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
    const transportType = process.env.MCP_TRANSPORT || 'stdio';
    
    if (transportType === 'http') {
      const port = parseInt(process.env.MCP_PORT || '4000');
      const host = process.env.MCP_HOST || '0.0.0.0';
      
      const httpServer = http.createServer();
      const transports = new Map<string, SSEServerTransport>();

      httpServer.on('request', async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        
        if (req.method === 'GET' && parsedUrl.pathname === '/sse') {
          logger.info('Received GET request to /sse - establishing SSE connection');
          
          try {
            // Create a new SSE transport - the first parameter is the POST endpoint path
            const transport = new SSEServerTransport('/messages', res);
            transports.set(transport.sessionId, transport);
            
            // Set up cleanup when connection closes
            transport.onclose = () => {
              logger.info(`SSE transport closed for session ${transport.sessionId}`);
              transports.delete(transport.sessionId);
            };
            
            // Connect the transport to the MCP server
            // This will automatically call transport.start() which sets up SSE headers
            await this.server.connect(transport);
            
            logger.info(`Established SSE stream with session ID: ${transport.sessionId}`);
          } catch (error) {
            logger.error('Error establishing SSE stream', { error });
            if (!res.headersSent) {
              res.writeHead(500).end('Error establishing SSE stream');
            }
          }
          
        } else if (req.method === 'POST' && parsedUrl.pathname === '/messages') {
          logger.info('Received POST request to /messages');
          
          // Extract session ID from query parameter
          const sessionId = parsedUrl.query.sessionId as string;
          
          if (!sessionId) {
            logger.error('No session ID provided in request URL');
            res.writeHead(400).end('Missing sessionId parameter');
            return;
          }
          
          const transport = transports.get(sessionId);
          if (!transport) {
            logger.error(`No active transport found for session ID: ${sessionId}`);
            res.writeHead(404).end('Session not found');
            return;
          }
          
          try {
            // Handle the POST message with the transport
            await transport.handlePostMessage(req, res);
          } catch (error) {
            logger.error('Error handling request', { error });
            if (!res.headersSent) {
              res.writeHead(500).end('Error handling request');
            }
          }
          
        } else {
          res.writeHead(404).end('Not found');
        }
      });

      httpServer.listen(port, host, () => {
        logger.info(`Motion MCP Server running on HTTP/SSE transport at ${host}:${port}`);
        logger.info('SSE endpoints:');
        logger.info(`  GET  http://${host}:${port}/sse - Establish SSE connection`);
        logger.info(`  POST http://${host}:${port}/messages?sessionId=<id> - Send messages`);
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('Shutting down HTTP server...');
        
        // Close all active transports
        for (const [sessionId, transport] of transports) {
          try {
            logger.info(`Closing transport for session ${sessionId}`);
            await transport.close();
          } catch (error) {
            logger.error(`Error closing transport for session ${sessionId}`, { error });
          }
        }
        
        transports.clear();
        httpServer.close();
        process.exit(0);
      });
      
    } else {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('Motion MCP Server running on stdio');
    }
  }
}

// Main entry point
async function main() {
  const server = new MotionMCPServer();
  await server.initialize();
  await server.run();
}

main().catch((error) => {
  logger.error('Fatal error', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : String(error),
  });
  process.exit(1);
});