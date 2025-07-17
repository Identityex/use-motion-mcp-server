// Generated MCP Controller: ContextController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * ContextController - MCP Controller Interface
 */
export interface ContextController {
  /**
   * Save project context for AI
   */
  saveContext: (req: {
    projectId: string;
    context: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Load project context
   */
  loadContext: (req: {
    projectId: string;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Context
 */
export const ContextToolNames = {
  saveContext: 'motion.context.save',
  loadContext: 'motion.context.load',
} as const;