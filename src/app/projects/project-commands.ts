// Project Commands
// Write operations for project domain

import { MotionService } from '../../services/motion-service';
import { StorageService } from '../../services/storage/storage-service';
import { 
  BindProjectRequest,
  SyncProjectRequest,
  MotionProject 
} from '../../api/mcp/v1-routes/models';
import { Transaction } from '../../services/utils/transaction';

export interface ProjectCommands {
  readonly bindProject: (req: BindProjectRequest) => Promise<{ projectId: string; localPath: string }>;
  readonly syncProject: (req: SyncProjectRequest) => Promise<{ projectId: string; syncedTasks: number }>;
}

export function createProjectCommands(deps: {
  readonly services: {
    readonly motionService: MotionService;
    readonly storageService: StorageService;
  };
}): ProjectCommands {
  return {
    bindProject: async (req) => {
      // Get all projects and find the one we want
      const projects = await deps.services.motionService.listProjects({});
      const project = projects.find(p => p.id === req.projectId);
      
      if (!project) {
        throw new Error(`Project not found`);
      }
      
      // Use transaction to ensure atomic binding
      const transaction = new Transaction();
      
      transaction.add(
        'bindToLocalStorage',
        async () => {
          await deps.services.storageService.bindProject(project);
        },
        async () => {
          // Rollback: unbind the project
          await deps.services.storageService.unbindProject(project.id);
        }
      );
      
      // Execute transaction
      await transaction.commit();
      
      return {
        projectId: project.id,
        localPath: `.claude/motion/${project.id}`,
      };
    },

    syncProject: async (req) => {
      // Get all projects and find the one we want
      const projects = await deps.services.motionService.listProjects({});
      const project = projects.find(p => p.id === req.projectId);
      
      if (!project) {
        throw new Error(`Project ${req.projectId} not found`);
      }
      
      // Get all tasks for the project
      const tasks = await deps.services.motionService.listTasks({
        projectId: req.projectId,
      });
      
      // Sync each task to local storage
      let syncedTasks = 0;
      for (const task of tasks) {
        await deps.services.storageService.saveTask(project.id, task);
        syncedTasks++;
      }
      
      return {
        projectId: project.id,
        syncedTasks,
      };
    },
  };
}