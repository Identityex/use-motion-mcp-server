// Generated MCP Controller: WorkspaceController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * WorkspaceController - MCP Controller Interface
 */
export interface WorkspaceController {
  /**
   * List all workspaces
   */
  listWorkspaces: (req: {
    limit?: number;
    cursor?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Set default workspace
   */
  setDefaultWorkspace: (req: {
    workspaceId: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Get workspace settings
   */
  getWorkspaceSettings: (req: {
    workspaceId?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Update workspace settings
   */
  updateWorkspaceSettings: (req: {
    workspaceId: string;
    settings?: Record<string, any>;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Workspace
 */
export const WorkspaceToolNames = {
  listWorkspaces: 'motion.workspace.list',
  setDefaultWorkspace: 'motion.workspace.set_default',
  getWorkspaceSettings: 'motion.workspace.get_settings',
  updateWorkspaceSettings: 'motion.workspace.update_settings',
} as const;