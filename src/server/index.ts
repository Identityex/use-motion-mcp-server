#!/usr/bin/env node

// Motion MCP Server Entry Point
// Follows the work-stable-api pattern: Controller > App > Services

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types';

import { createDependencies, Config } from '../setup/dependencies';
import { MCPTools } from '../api/mcp/v1-routes/tools';
import { ProjectControllerToolNames } from '../api/mcp/v1-routes/routes/ProjectControllerRoutes';
import { TaskControllerToolNames } from '../api/mcp/v1-routes/routes/TaskControllerRoutes';
import { MCPToolResponse } from '../api/mcp/v1-routes/models';

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
      model: process.env.AI_MODEL,
    },
  };
}

class MotionMCPServer {
  private readonly server: Server;
  private readonly dependencies: ReturnType<typeof createDependencies>;

  constructor() {
    const config = loadConfig();

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
      const controller = this.dependencies.controllers.motionController;

      try {
        let response: MCPToolResponse;
        
        switch (name) {
          case 'motion.project.list':
            response = await controller.listProjects(args || {});
            break;
          
          case 'motion.project.create':
            response = await controller.createProject(args || {});
            break;
          
          case 'motion.task.list':
            response = await controller.listTasks(args || {});
            break;
          
          case 'motion.task.create':
            response = await controller.createTask(args || {});
            break;
          
          case 'motion.task.update':
            response = await controller.updateTask(args || {});
            break;
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        // MCP SDK expects content directly, not wrapped in MCPToolResponse
        return {
          content: response.content,
        };
      } catch (error) {
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Motion MCP Server running on stdio');
  }
}

// Main entry point
const server = new MotionMCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});