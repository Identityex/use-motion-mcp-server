// Generated MCP Route: TaskControllerRoutes
// This file is auto-generated. Do not edit manually.

import { MCPToolHandler } from '../../v1-controllers/types';

/**
 * TaskControllerRoutes - MCP Route Interface
 */
export interface TaskControllerRoutes {
  /**
   * Create a new task
   */
  createTask: MCPToolHandler<{
    name: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    projectId?: string;
    workspaceId?: string;
    assigneeId?: string;
    dueDate?: string;
    enrich?: boolean;
  }>;
}

/**
 * MCP tool names for TaskController
 */
export const TaskControllerToolNames = {
  createTask: 'motion.task.create',
} as const;