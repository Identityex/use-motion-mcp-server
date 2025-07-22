// Context Commands
// Operations for saving and loading project context

import { StorageService } from '../../services/storage/storage-service.js';
import {
  SaveContextRequest,
  LoadContextRequest
} from '../../api/mcp/v1-routes/models/index.js';

export interface ContextCommands {
  readonly saveContext: (req: SaveContextRequest) => Promise<{
    projectId: string;
    saved: boolean;
  }>;
  readonly loadContext: (req: LoadContextRequest) => Promise<{
    projectId: string;
    context: string;
  }>;
}

export function createContextCommands(deps: {
  readonly services: {
    readonly storageService: StorageService;
  };
}): ContextCommands {
  return {
    saveContext: async (req) => {
      // Save context to local storage
      await deps.services.storageService.saveProjectContext(
        req.projectId,
        req.context
      );
      
      return {
        projectId: req.projectId,
        saved: true,
      };
    },

    loadContext: async (req) => {
      // Load context from local storage
      const context = await deps.services.storageService.loadProjectContext(
        req.projectId
      );
      
      return {
        projectId: req.projectId,
        context: context || '',
      };
    },
  };
}