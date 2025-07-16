// Generated MCP Tools Configuration
// This file is auto-generated. Do not edit manually.

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All MCP tools defined in the OpenAPI schemas
 */
export const MCPTools: Tool[] = [
  {
    name: 'motion.project.list',
    description: 'List all projects with pagination',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        workspaceId: {
          type: 'string',
          description: 'Workspace ID to filter projects'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of items to return',
          minimum: 1,
          maximum: 100,
          default: 50
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor'
        },
      }
    }
  },
  {
    name: 'motion.task.create',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          description: 'Task name'
        },
        description: {
          type: 'string',
          description: 'Task description'
        },
        priority: {
          type: 'string',
          description: 'Task priority',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        projectId: {
          type: 'string',
          description: 'Project ID to assign task to'
        },
        workspaceId: {
          type: 'string',
          description: 'Workspace ID'
        },
        assigneeId: {
          type: 'string',
          description: 'User ID to assign task to'
        },
        dueDate: {
          type: 'string',
          description: 'Task due date in ISO format'
        },
        enrich: {
          type: 'boolean',
          description: 'Whether to enrich task with AI',
          default: false
        },
      }
    }
  },
];