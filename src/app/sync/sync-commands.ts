// Sync Commands
// Operations for synchronization between Motion and local storage

import { MotionService } from '../../services/motion-service';
import { StorageService } from '../../services/storage/storage-service';
import {
  SyncAllRequest,
  CheckSyncRequest
} from '../../api/mcp/v1-routes/models';
import { lockManager } from '../../services/utils/lock-manager';
import { createDomainLogger } from '../../services/utils/logger';

export interface SyncCommands {
  readonly syncAll: (req: SyncAllRequest) => Promise<{
    syncedProjects: number;
    syncedTasks: number;
  }>;
  readonly checkSync: (req: CheckSyncRequest) => Promise<{
    projectId?: string;
    localTasks: number;
    remoteTasks: number;
    outOfSync: boolean;
    conflicts: Array<{
      taskId: string;
      taskName: string;
      type: 'missing_local' | 'missing_remote' | 'modified';
      details?: string;
    }>;
  }>;
}

export function createSyncCommands(deps: {
  readonly services: {
    readonly motionService: MotionService;
    readonly storageService: StorageService;
  };
}): SyncCommands {
  const logger = createDomainLogger('sync');
  
  return {
    syncAll: async (req) => {
      // Acquire global sync lock
      return await lockManager.withLock('global-sync', async () => {
        logger.info('Starting global sync');
        
        // Get all bound projects from local storage
        const boundProjects = await deps.services.storageService.listBoundProjects();
        
        let syncedProjects = 0;
        let syncedTasks = 0;
        
        for (const projectMeta of boundProjects) {
          // Acquire project-specific lock
          await lockManager.withLock(`project-sync-${projectMeta.id}`, async () => {
            logger.info('Syncing project', { projectId: projectMeta.id, projectName: projectMeta.name });
            
            // Get all tasks for the project from Motion
            const remoteTasks = await deps.services.motionService.listTasks({
              projectId: projectMeta.id,
            });
            
            // Get local tasks to detect deletions
            const localTasks = await deps.services.storageService.listTasksAsMotionTasks(projectMeta.id);
            const remoteTaskIds = new Set(remoteTasks.map(t => t.id));
            
            // Remove tasks that no longer exist in Motion
            for (const localTask of localTasks) {
              if (!remoteTaskIds.has(localTask.id)) {
                await deps.services.storageService.deleteTask(projectMeta.id, localTask.id);
              }
            }
            
            // Sync each task from Motion (add or update)
            for (const task of remoteTasks) {
              await deps.services.storageService.saveTask(projectMeta.id, task);
              syncedTasks++;
            }
            
            syncedProjects++;
          });
        }
        
        logger.info('Global sync completed', { syncedProjects, syncedTasks });
        
        return {
          syncedProjects,
          syncedTasks,
        };
      }, { ttl: 300000 }); // 5 minute TTL for global sync
    },

    checkSync: async (req) => {
      const conflicts: Array<{
        taskId: string;
        taskName: string;
        type: 'missing_local' | 'missing_remote' | 'modified';
        details?: string;
      }> = [];

      if (req.projectId) {
        // Check specific project
        const localTasks = await deps.services.storageService.listTasksAsMotionTasks(req.projectId);
        const remoteTasks = await deps.services.motionService.listTasks({
          projectId: req.projectId,
        });
        
        // Create maps for easy lookup
        const localTaskMap = new Map(localTasks.map(t => [t.id, t]));
        const remoteTaskMap = new Map(remoteTasks.map(t => [t.id, t]));
        
        // Find tasks missing locally
        for (const remoteTask of remoteTasks) {
          if (!localTaskMap.has(remoteTask.id)) {
            conflicts.push({
              taskId: remoteTask.id,
              taskName: remoteTask.name,
              type: 'missing_local',
              details: 'Task exists in Motion but not locally',
            });
          }
        }
        
        // Find tasks missing remotely or modified
        for (const localTask of localTasks) {
          const remoteTask = remoteTaskMap.get(localTask.id);
          if (!remoteTask) {
            conflicts.push({
              taskId: localTask.id,
              taskName: localTask.name,
              type: 'missing_remote',
              details: 'Task exists locally but not in Motion',
            });
          } else {
            // Check for modifications (compare key fields)
            const hasModifications = 
              localTask.name !== remoteTask.name ||
              localTask.description !== remoteTask.description ||
              localTask.status !== remoteTask.status ||
              localTask.priority !== remoteTask.priority ||
              localTask.deadline !== remoteTask.deadline;
              
            if (hasModifications) {
              conflicts.push({
                taskId: localTask.id,
                taskName: localTask.name,
                type: 'modified',
                details: 'Task has been modified (name, description, status, priority, or deadline differs)',
              });
            }
          }
        }
        
        return {
          projectId: req.projectId,
          localTasks: localTasks.length,
          remoteTasks: remoteTasks.length,
          outOfSync: conflicts.length > 0,
          conflicts,
        };
      } else {
        // Check all projects
        const boundProjects = await deps.services.storageService.listBoundProjects();
        let totalLocal = 0;
        let totalRemote = 0;
        
        for (const projectMeta of boundProjects) {
          const localTasks = await deps.services.storageService.listTasksAsMotionTasks(projectMeta.id);
          const remoteTasks = await deps.services.motionService.listTasks({
            projectId: projectMeta.id,
          });
          
          totalLocal += localTasks.length;
          totalRemote += remoteTasks.length;
          
          // Create maps for easy lookup
          const localTaskMap = new Map(localTasks.map(t => [t.id, t]));
          const remoteTaskMap = new Map(remoteTasks.map(t => [t.id, t]));
          
          // Find conflicts for this project
          for (const remoteTask of remoteTasks) {
            if (!localTaskMap.has(remoteTask.id)) {
              conflicts.push({
                taskId: remoteTask.id,
                taskName: remoteTask.name,
                type: 'missing_local',
                details: `Task in project ${projectMeta.name} exists in Motion but not locally`,
              });
            }
          }
          
          for (const localTask of localTasks) {
            const remoteTask = remoteTaskMap.get(localTask.id);
            if (!remoteTask) {
              conflicts.push({
                taskId: localTask.id,
                taskName: localTask.name,
                type: 'missing_remote',
                details: `Task in project ${projectMeta.name} exists locally but not in Motion`,
              });
            } else {
              // Check for modifications
              const hasModifications = 
                localTask.name !== remoteTask.name ||
                localTask.description !== remoteTask.description ||
                localTask.status !== remoteTask.status ||
                localTask.priority !== remoteTask.priority ||
                localTask.deadline !== remoteTask.deadline;
                
              if (hasModifications) {
                conflicts.push({
                  taskId: localTask.id,
                  taskName: localTask.name,
                  type: 'modified',
                  details: `Task in project ${projectMeta.name} has been modified`,
                });
              }
            }
          }
        }
        
        return {
          localTasks: totalLocal,
          remoteTasks: totalRemote,
          outOfSync: conflicts.length > 0,
          conflicts,
        };
      }
    },
  };
}