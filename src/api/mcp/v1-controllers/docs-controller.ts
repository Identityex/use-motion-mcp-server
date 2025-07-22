// Docs Controller
// MCP tool handlers for Docs domain operations

import { DocsCommands } from '../../../app/docs/docs-commands.js';
import { DocsController } from '../v1-routes/routes/DocsControllerRoutes.js';

export function createDocsController(deps: {
  readonly app: {
    readonly docsCommands: DocsCommands;
  };
}): DocsController {
  return {
    createDocs: async (req) => {
      try {
        const result = await deps.app.docsCommands.createDocs(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Documentation created: ${result.docId}`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error creating docs: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    updateDocs: async (req) => {
      try {
        const result = await deps.app.docsCommands.updateDocs(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Documentation updated: ${result.docId}`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error updating docs: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    generateStatusReport: async (req) => {
      try {
        const result = await deps.app.docsCommands.generateStatusReport(req);
        
        return {
          content: [{
            type: 'text',
            text: result.report,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error generating status report: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}