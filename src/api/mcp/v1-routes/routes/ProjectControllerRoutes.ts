// Generated MCP Controller: ProjectController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * ProjectController - MCP Controller Interface
 */
export interface ProjectController {
  /**
   * List all projects with pagination
   */
  listProjects: (req: {
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Create a new project
   */
  createProject: (req: {
    name: string;
    description?: string;
    workspaceId?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Bind project to local storage
   */
  bindProject: (req: {
    projectId: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Sync project with Motion
   */
  syncProject: (req: {
    projectId: string;
    force?: boolean;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Project
 */
export const ProjectToolNames = {
  listProjects: 'motion.project.list',
  createProject: 'motion.project.create',
  bindProject: 'motion.project.bind',
  syncProject: 'motion.project.sync',
} as const;