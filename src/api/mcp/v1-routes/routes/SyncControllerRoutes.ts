// Generated MCP Controller: SyncController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * SyncController - MCP Controller Interface
 */
export interface SyncController {
  /**
   * Sync all bound projects
   */
  syncAll: (req: {
    force?: boolean;
  }) => Promise<MCPToolResponse>;
  /**
   * Check sync status
   */
  checkSync: (req: {
    projectId?: string;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Sync
 */
export const SyncToolNames = {
  syncAll: 'motion.sync.all',
  checkSync: 'motion.sync.check',
} as const;