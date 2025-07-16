// Motion Commands
// Write operations for Motion domain

import { MotionService, CreateProjectParams, CreateTaskParams, UpdateTaskParams } from '../../services/motion/motion-service';
import { AIService } from '../../services/ai/ai-service';

export interface CreateProjectRequest {
  readonly name: string;
  readonly description?: string;
  readonly workspaceId?: string;
  readonly enrich?: boolean;
}

export interface CreateTaskRequest {
  readonly name: string;
  readonly description?: string;
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly projectId?: string;
  readonly workspaceId?: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly enrich?: boolean;
}

export interface UpdateTaskRequest {
  readonly taskId: string;
  readonly name?: string;
  readonly description?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly enrich?: boolean;
}

export interface MotionCommands {
  readonly createProject: (req: CreateProjectRequest) => Promise<{ id: string; name: string; description?: string }>;
  readonly createTask: (req: CreateTaskRequest) => Promise<{ id: string; name: string; description?: string }>;
  readonly updateTask: (req: UpdateTaskRequest) => Promise<{ id: string; name: string; description?: string }>;
}

export function createMotionCommands(deps: {
  readonly services: {
    readonly motionService: MotionService;
    readonly aiService: AIService;
  };
}): MotionCommands {
  return {
    createProject: async (req) => {
      let description = req.description;
      
      // Enhance description with AI if requested
      if (req.enrich && description) {
        description = await deps.services.aiService.enhanceProjectDescription(
          description,
          { projectName: req.name }
        );
      }

      const params: CreateProjectParams = {
        name: req.name,
        description,
        workspaceId: req.workspaceId,
      };

      const project = await deps.services.motionService.createProject(params);
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
      };
    },

    createTask: async (req) => {
      let description = req.description;
      
      // Enhance description with AI if requested
      if (req.enrich && description) {
        description = await deps.services.aiService.enhanceTaskDescription(
          description,
          { taskName: req.name }
        );
      }

      const params: CreateTaskParams = {
        name: req.name,
        description,
        priority: req.priority,
        projectId: req.projectId,
        workspaceId: req.workspaceId,
        assigneeId: req.assigneeId,
        dueDate: req.dueDate,
      };

      const task = await deps.services.motionService.createTask(params);
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
      };
    },

    updateTask: async (req) => {
      let description = req.description;
      
      // Enhance description with AI if requested and description is being updated
      if (req.enrich && description) {
        description = await deps.services.aiService.enhanceTaskDescription(
          description,
          { taskName: req.name }
        );
      }

      const params: UpdateTaskParams = {
        taskId: req.taskId,
        name: req.name,
        description,
        status: req.status,
        priority: req.priority,
        assigneeId: req.assigneeId,
        dueDate: req.dueDate,
      };

      const task = await deps.services.motionService.updateTask(params);
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
      };
    },
  };
}