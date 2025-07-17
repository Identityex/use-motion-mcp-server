// Motion Commands
// Write operations for Motion domain

import { MotionService } from '../../services/motion-service';
import { AIService } from '../../services/ai/ai-service';
import { 
  CreateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest 
} from '../../api/mcp/v1-routes/models';

// Motion-specific request types that extend the base MCP types
export interface MotionCreateProjectRequest {
  readonly name: string;
  readonly description?: string;
  readonly workspaceId?: string;
  readonly enrich?: boolean;
}

export interface MotionCreateTaskRequest {
  readonly name: string;
  readonly description?: string;
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly projectId?: string;
  readonly workspaceId?: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly duration?: number;
  readonly enrich?: boolean;
}

export interface MotionUpdateTaskRequest {
  readonly taskId: string;
  readonly name?: string;
  readonly description?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly duration?: number;
  readonly enrich?: boolean;
}

export interface MotionCommands {
  readonly createProject: (req: MotionCreateProjectRequest) => Promise<{ id: string; name: string; description?: string }>;
  readonly createTask: (req: MotionCreateTaskRequest) => Promise<{ id: string; name: string; description?: string }>;
  readonly updateTask: (req: MotionUpdateTaskRequest) => Promise<{ id: string; name: string; description?: string }>;
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

      const project = await deps.services.motionService.createProject({
        name: req.name,
        description,
        workspaceId: req.workspaceId,
      });
      
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

      const task = await deps.services.motionService.createTask({
        name: req.name,
        description,
        priority: req.priority,
        projectId: req.projectId,
        duration: req.duration,
        dueDate: req.dueDate,
      });
      
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

      const task = await deps.services.motionService.updateTask({
        taskId: req.taskId,
        name: req.name,
        description,
        status: req.status,
        priority: req.priority,
        dueDate: req.dueDate,
      });
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
      };
    },
  };
}