// Sync Controller
// MCP tool handlers for Sync domain operations

import { SyncCommands } from '../../../app/sync/sync-commands.js';
import { SyncController } from '../v1-routes/routes/SyncControllerRoutes.js';

export function createSyncController(deps: {
  readonly app: {
    readonly syncCommands: SyncCommands;
  };
}): SyncController {
  return {
    syncAll: async (req) => {
      try {
        const result = await deps.app.syncCommands.syncAll(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Synced ${result.syncedProjects} projects with ${result.syncedTasks} total tasks`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error syncing all: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    checkSync: async (req) => {
      try {
        const result = await deps.app.syncCommands.checkSync(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: result.outOfSync ? 'Local and remote are out of sync' : 'Local and remote are in sync',
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error checking sync: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}