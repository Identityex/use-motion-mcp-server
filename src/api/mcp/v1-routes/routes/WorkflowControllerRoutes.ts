// Generated MCP Controller: WorkflowController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * WorkflowController - MCP Controller Interface
 */
export interface WorkflowController {
  /**
   * Generate comprehensive plans
   */
  planWorkflow: (req: {
    goal: string;
    projectId: string;
    context?: string;
    constraints?: Record<string, any>;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Workflow
 */
export const WorkflowToolNames = {
  planWorkflow: 'motion.workflow.plan',
} as const;