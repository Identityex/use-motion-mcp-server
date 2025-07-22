// Context Controller
// MCP tool handlers for Context domain operations

import { ContextCommands } from '../../../app/context/context-commands.js';
import { ContextController } from '../v1-routes/routes/ContextControllerRoutes.js';

export function createContextController(deps: {
  readonly app: {
    readonly contextCommands: ContextCommands;
  };
}): ContextController {
  return {
    saveContext: async (req) => {
      try {
        const result = await deps.app.contextCommands.saveContext(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Context saved for project ${result.projectId}`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error saving context: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    loadContext: async (req) => {
      try {
        const result = await deps.app.contextCommands.loadContext(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Context loaded for project ${result.projectId}`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error loading context: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}