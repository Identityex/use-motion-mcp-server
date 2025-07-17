// Generated MCP Controller: DocsController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * DocsController - MCP Controller Interface
 */
export interface DocsController {
  /**
   * Generate project documentation
   */
  createDocs: (req: {
    projectId: string;
    type: 'readme' | 'architecture' | 'api' | 'user-guide';
    template?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Update existing docs
   */
  updateDocs: (req: {
    projectId: string;
    docId: string;
    content: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Generate status reports
   */
  generateStatusReport: (req: {
    projectId: string;
    format?: 'markdown' | 'json' | 'summary';
    includeMetrics?: boolean;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Docs
 */
export const DocsToolNames = {
  createDocs: 'motion.docs.create',
  updateDocs: 'motion.docs.update',
  generateStatusReport: 'motion.status.report',
} as const;