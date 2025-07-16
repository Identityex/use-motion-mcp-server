// Generated MCP Route: ProjectControllerRoutes
// This file is auto-generated. Do not edit manually.

import { MCPToolHandler } from '../../v1-controllers/types';

/**
 * ProjectControllerRoutes - MCP Route Interface
 */
export interface ProjectControllerRoutes {
  /**
   * List all projects with pagination
   */
  listProjects: MCPToolHandler<{
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }>;
}

/**
 * MCP tool names for ProjectController
 */
export const ProjectControllerToolNames = {
  listProjects: 'motion.project.list',
} as const;