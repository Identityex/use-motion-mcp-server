// MCP Tools Setup
// Tool registration for Model Context Protocol

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MotionController } from '../api/mcp/v1-controllers/motion-controller';

export interface MCPToolsConfig {
  readonly controller: MotionController;
}

export function createMCPTools(config: MCPToolsConfig): Tool[] {
  const { controller } = config;

  return [
    {
      name: 'motion.project.list',
      description: 'List all projects in Motion with optional pagination and workspace filtering',
      inputSchema: {
        type: 'object',
        properties: {
          workspaceId: {
            type: 'string',
            description: 'Motion workspace ID to filter projects',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of projects to return (1-100)',
            minimum: 1,
            maximum: 100,
            default: 50,
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for retrieving next page',
          },
        },
      },
    },
    {
      name: 'motion.project.create',
      description: 'Create a new project in Motion with specified parameters',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'Project name',
            minLength: 1,
            maxLength: 255,
          },
          description: {
            type: 'string',
            description: 'Project description',
            maxLength: 1000,
          },
          workspaceId: {
            type: 'string',
            description: 'Motion workspace ID',
          },
          enrich: {
            type: 'boolean',
            description: 'Use AI to enhance project description',
            default: false,
          },
        },
      },
    },
    {
      name: 'motion.task.list',
      description: 'List tasks with filtering by project, status, assignee, and other criteria',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'Filter tasks by project ID',
          },
          workspaceId: {
            type: 'string',
            description: 'Filter tasks by workspace ID',
          },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            description: 'Filter tasks by status',
          },
          assigneeId: {
            type: 'string',
            description: 'Filter tasks by assignee ID',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of tasks to return (1-100)',
            minimum: 1,
            maximum: 100,
            default: 50,
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor for retrieving next page',
          },
        },
      },
    },
    {
      name: 'motion.task.create',
      description: 'Create a new task in Motion with AI-enhanced descriptions',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'Task name',
            minLength: 1,
            maxLength: 255,
          },
          description: {
            type: 'string',
            description: 'Task description',
            maxLength: 2000,
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            description: 'Task priority level',
          },
          projectId: {
            type: 'string',
            description: 'Project ID to assign task to',
          },
          workspaceId: {
            type: 'string',
            description: 'Workspace ID',
          },
          assigneeId: {
            type: 'string',
            description: 'User ID to assign task to',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Task due date',
          },
          enrich: {
            type: 'boolean',
            description: 'Use AI to enhance task description',
            default: false,
          },
        },
      },
    },
    {
      name: 'motion.task.update',
      description: 'Update task details including status, priority, assignee, and description',
      inputSchema: {
        type: 'object',
        required: ['taskId'],
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of task to update',
          },
          name: {
            type: 'string',
            description: 'Updated task name',
            minLength: 1,
            maxLength: 255,
          },
          description: {
            type: 'string',
            description: 'Updated task description',
            maxLength: 2000,
          },
          status: {
            type: 'string',
            enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            description: 'Updated task status',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            description: 'Updated task priority',
          },
          assigneeId: {
            type: 'string',
            description: 'Updated assignee ID',
          },
          dueDate: {
            type: 'string',
            format: 'date-time',
            description: 'Updated due date',
          },
          enrich: {
            type: 'boolean',
            description: 'Use AI to enhance updated description',
            default: false,
          },
        },
      },
    },
  ];
}