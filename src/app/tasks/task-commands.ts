// Task Commands
// Write operations for task domain

import { MotionService } from '../../services/motion-service.js';
import { CreateTaskRequest } from '../../api/mcp/v1-routes/models/index.js';
import { AIService } from '../../services/ai/ai-service.js';
import { StorageService } from '../../services/storage/storage-service.js';
import { lockManager } from '../../services/utils/lock-manager.js';
import {
  BatchCreateTasksRequest,
  CompleteTaskRequest,
  MoveTaskRequest,
  EnrichTaskRequest,
  AnalyzeTaskRequest,
  SearchTasksRequest,
  MotionTask
} from '../../api/mcp/v1-routes/models/index.js';
import { motionStatusToString } from '../../services/utils/type-mappers.js';
import { Transaction } from '../../services/utils/transaction.js';

export interface UpdateTaskRequest {
  readonly taskId: string;
  readonly name?: string;
  readonly description?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly dueDate?: string;
  readonly duration?: number;
  readonly labels?: string[];
}

export interface TaskCommands {
  readonly createTask: (req: CreateTaskRequest) => Promise<MotionTask>;
  readonly updateTask: (req: UpdateTaskRequest) => Promise<MotionTask>;
  readonly batchCreateTasks: (req: BatchCreateTasksRequest) => Promise<{ tasks: Array<{ id: string; name: string }> }>;
  readonly completeTask: (req: CompleteTaskRequest) => Promise<{ taskId: string; completed: boolean }>;
  readonly moveTask: (req: MoveTaskRequest) => Promise<{ taskId: string; newProjectId: string }>;
  readonly enrichTask: (req: EnrichTaskRequest) => Promise<{ taskId: string; enhanced: boolean }>;
  readonly analyzeTask: (req: AnalyzeTaskRequest) => Promise<{ taskId: string; complexity: string; estimatedDuration: number }>;
}

export function createTaskCommands(deps: {
  readonly services: {
    readonly motionService: MotionService;
    readonly aiService: AIService;
    readonly storageService: StorageService;
  };
}): TaskCommands {
  return {
    createTask: async (req) => {
      // Create task with AI enrichment if enabled
      let taskData = req;
      
      if (req.enrich && deps.services.aiService) {
        const enhanced = await deps.services.aiService.enhanceTaskDescription(
          req.description || req.name,
          {
            taskName: req.name,
          }
        );
        taskData = { ...req, description: enhanced };
      }
      
      // Use transaction for atomic operation
      const transaction = new Transaction();
      let createdTask: MotionTask | undefined;
      
      // Add Motion API creation
      transaction.add(
        'createMotionTask',
        async () => {
          createdTask = await deps.services.motionService.createTask(taskData);
          return createdTask;
        },
        async () => {
          // Rollback: delete the task from Motion if it was created
          if (createdTask) {
            await deps.services.motionService.deleteTask(createdTask.id);
          }
        }
      );
      
      // Add local storage save if project is bound
      if (req.projectId) {
        transaction.add(
          'saveToLocalStorage',
          async () => {
            if (!createdTask) throw new Error('Task not created');
            await deps.services.storageService.saveTask(req.projectId!, createdTask);
          },
          async () => {
            // Rollback: remove from local storage
            if (createdTask && req.projectId) {
              await deps.services.storageService.deleteTask(req.projectId, createdTask.id);
            }
          }
        );
      }
      
      // Execute transaction
      await transaction.commit();
      
      return transaction.getResult<MotionTask>('createMotionTask')!;
    },

    updateTask: async (req) => {
      // First get the current task to have rollback data
      const existingTasks = await deps.services.motionService.listTasks({ taskId: req.taskId });
      const existingTask = existingTasks[0];
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // Use transaction for atomic operation
      const transaction = new Transaction();
      let updatedTask: MotionTask | undefined;
      
      // Add Motion API update
      transaction.add(
        'updateMotionTask',
        async () => {
          updatedTask = await deps.services.motionService.updateTask(req);
          return updatedTask;
        },
        async () => {
          // Rollback: restore original task state
          await deps.services.motionService.updateTask({
            taskId: existingTask.id,
            name: existingTask.name,
            description: existingTask.description,
            status: motionStatusToString(existingTask.status) as any,
            priority: existingTask.priority as any,
            dueDate: existingTask.deadline,
          });
        }
      );
      
      // Add local storage update if project is bound
      if (existingTask.projectId) {
        transaction.add(
          'updateLocalStorage',
          async () => {
            if (!updatedTask) throw new Error('Task not updated');
            await deps.services.storageService.saveTask(existingTask.projectId!, updatedTask);
          },
          async () => {
            // Rollback: restore original in local storage
            await deps.services.storageService.saveTask(existingTask.projectId!, existingTask);
          }
        );
      }
      
      // Execute transaction
      await transaction.commit();
      
      return transaction.getResult<MotionTask>('updateMotionTask')!;
    },

    batchCreateTasks: async (req) => {
      // Use AI to break down the goal into tasks
      const taskSuggestions = await deps.services.aiService.breakdownGoal({
        goal: req.goal,
        maxTasks: req.maxTasks || 5,
        context: req.context,
      });
      
      // Create each task
      const createdTasks = [];
      for (const suggestion of taskSuggestions) {
        const task = await deps.services.motionService.createTask({
          name: suggestion.name,
          description: suggestion.description,
          priority: (suggestion.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          projectId: req.projectId,
          duration: suggestion.estimatedMinutes,
        });
        createdTasks.push({
          id: task.id,
          name: task.name,
        });
      }
      
      return { tasks: createdTasks };
    },


    completeTask: async (req) => {
      // Update task status to completed
      const task = await deps.services.motionService.updateTask({
        taskId: req.taskId,
        status: 'COMPLETED',
      });
      
      // Update local storage if bound
      if (task.projectId) {
        await deps.services.storageService.saveTask(task.projectId, task);
      }
      
      return {
        taskId: task.id,
        completed: motionStatusToString(task.status) === 'COMPLETED',
      };
    },

    moveTask: async (req) => {
      // Move task to new project
      const task = await deps.services.motionService.moveTask(req.taskId, req.targetProjectId);
      
      // Update local storage
      if (task.projectId) {
        await deps.services.storageService.saveTask(task.projectId, task);
      }
      
      return {
        taskId: task.id,
        newProjectId: task.projectId || req.targetProjectId,
      };
    },

    enrichTask: async (req) => {
      // Get current task
      const tasks = await deps.services.motionService.listTasks({});
      const task = tasks.find(t => t.id === req.taskId);
      
      if (!task) {
        throw new Error(`Task ${req.taskId} not found`);
      }
      
      // Enhance description with AI
      const enhancedDescription = await deps.services.aiService.enhanceTaskDescription(
        task.description || task.name,
        {
          taskName: task.name,
          context: req.context,
        }
      );
      
      // Update task with enhanced description
      const updatedTask = await deps.services.motionService.updateTask({
        taskId: req.taskId,
        description: enhancedDescription,
      });
      
      // Update local storage
      if (updatedTask.projectId) {
        await deps.services.storageService.saveTask(updatedTask.projectId, updatedTask);
      }
      
      return {
        taskId: updatedTask.id,
        enhanced: true,
      };
    },

    analyzeTask: async (req) => {
      // Get task details
      const tasks = await deps.services.motionService.listTasks({});
      const task = tasks.find(t => t.id === req.taskId);
      
      if (!task) {
        throw new Error(`Task ${req.taskId} not found`);
      }
      
      // Analyze with AI
      const analysis = await deps.services.aiService.analyzeTask({
        name: task.name,
        description: task.description,
      });
      
      return {
        taskId: task.id,
        complexity: analysis.complexity,
        estimatedDuration: analysis.estimatedMinutes,
      };
    },
  };
}