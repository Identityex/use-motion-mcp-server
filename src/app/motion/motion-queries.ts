// Motion Queries
// Read operations for Motion domain

import { MotionService, ListProjectsParams, ListTasksParams, Project, Task } from '../../services/motion/motion-service';

export interface ListProjectsRequest {
  readonly workspaceId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ListTasksRequest {
  readonly projectId?: string;
  readonly workspaceId?: string;
  readonly status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly assigneeId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TaskSummary {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  readonly projectId?: string;
  readonly workspaceId: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MotionQueries {
  readonly listProjects: (req: ListProjectsRequest) => Promise<ProjectSummary[]>;
  readonly listTasks: (req: ListTasksRequest) => Promise<TaskSummary[]>;
}

export function createMotionQueries(deps: {
  readonly services: {
    readonly motionService: MotionService;
  };
}): MotionQueries {
  return {
    listProjects: async (req) => {
      const params: ListProjectsParams = {
        workspaceId: req.workspaceId,
        limit: req.limit,
        cursor: req.cursor,
      };

      const projects = await deps.services.motionService.listProjects(params);
      
      return projects.map(mapProjectToSummary);
    },

    listTasks: async (req) => {
      const params: ListTasksParams = {
        projectId: req.projectId,
        workspaceId: req.workspaceId,
        status: req.status,
        assigneeId: req.assigneeId,
        limit: req.limit,
        cursor: req.cursor,
      };

      const tasks = await deps.services.motionService.listTasks(params);
      
      return tasks.map(mapTaskToSummary);
    },
  };
}

function mapProjectToSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    workspaceId: project.workspaceId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function mapTaskToSummary(task: Task): TaskSummary {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId,
    workspaceId: task.workspaceId,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}