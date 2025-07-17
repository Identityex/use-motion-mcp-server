// Task Queries
// Read operations for task domain

import { MotionService } from '../../services/motion-service';
import { StorageService } from '../../services/storage/storage-service';
import { MotionTask } from '../../api/mcp/v1-routes/models';

export interface SearchTasksRequest {
  readonly query: string;
  readonly projectId?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface ListTasksRequest {
  readonly projectId?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly limit?: number;
  readonly cursor?: string;
}

export interface TaskQueries {
  readonly listTasks: (req: ListTasksRequest) => Promise<MotionTask[]>;
  readonly searchTasks: (req: SearchTasksRequest) => Promise<MotionTask[]>;
}

export function createTaskQueries(deps: {
  readonly services: {
    readonly motionService: MotionService;
    readonly storageService: StorageService;
  };
}): TaskQueries {
  return {
    listTasks: async (req) => {
      // List tasks from Motion API
      const tasks = await deps.services.motionService.listTasks({
        projectId: req.projectId,
        status: req.status,
        limit: req.limit,
        cursor: req.cursor,
      });
      
      return tasks;
    },

    searchTasks: async (req) => {
      // Search in local storage
      const localTasks = await deps.services.storageService.searchTasks({
        query: req.query,
        projectId: req.projectId,
        status: req.status,
      });
      
      return localTasks;
    },
  };
}