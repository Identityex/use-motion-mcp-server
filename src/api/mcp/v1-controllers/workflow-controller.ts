// Workflow Controller
// MCP tool handlers for Workflow domain operations

import { WorkflowCommands } from '../../../app/workflow/workflow-commands.js';
import { WorkflowController } from '../v1-routes/routes/WorkflowControllerRoutes.js';

export function createWorkflowController(deps: {
  readonly app: {
    readonly workflowCommands: WorkflowCommands;
  };
}): WorkflowController {
  return {
    planWorkflow: async (req) => {
      try {
        const result = await deps.app.workflowCommands.planWorkflow(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Workflow plan generated with ${result.plan.phases.length} phases`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error planning workflow: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}