// Motion Queries
// Read operations for Motion domain

import { MotionService } from '../../services/motion-service.js';
import { MotionProject, MotionTask } from '../../api/mcp/v1-routes/models/index.js';
import { motionStatusToString } from '../../services/utils/type-mappers.js';

export interface MotionListProjectsRequest {
  readonly workspaceId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface MotionListTasksRequest {
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
  readonly listProjects: (req: MotionListProjectsRequest) => Promise<ProjectSummary[]>;
  readonly listTasks: (req: MotionListTasksRequest) => Promise<TaskSummary[]>;
  readonly listProjectsWithPagination: (req: MotionListProjectsRequest) => Promise<{
    projects: ProjectSummary[];
    nextCursor?: string;
  }>;
  readonly listTasksWithPagination: (req: MotionListTasksRequest) => Promise<{
    tasks: TaskSummary[];
    nextCursor?: string;
  }>;
}

export function createMotionQueries(deps: {
  readonly services: {
    readonly motionService: MotionService;
  };
}): MotionQueries {
  return {
    listProjects: async (req) => {
      const projects = await deps.services.motionService.listProjects({
        workspaceId: req.workspaceId,
        limit: req.limit,
        cursor: req.cursor,
      });
      
      return projects.map(mapProjectToSummary);
    },

    listTasks: async (req) => {
      const tasks = await deps.services.motionService.listTasks({
        projectId: req.projectId,
        workspaceId: req.workspaceId,
        status: req.status,
        assigneeId: req.assigneeId,
        limit: req.limit,
        cursor: req.cursor,
      });
      
      return tasks.map(mapTaskToSummary);
    },

    listProjectsWithPagination: async (req) => {
      const result = await deps.services.motionService.listProjectsWithPagination({
        workspaceId: req.workspaceId,
        limit: req.limit,
        cursor: req.cursor,
      });
      
      return {
        projects: result.projects.map(mapProjectToSummary),
        nextCursor: result.nextCursor,
      };
    },

    listTasksWithPagination: async (req) => {
      const result = await deps.services.motionService.listTasksWithPagination({
        projectId: req.projectId,
        workspaceId: req.workspaceId,
        status: req.status,
        assigneeId: req.assigneeId,
        limit: req.limit,
        cursor: req.cursor,
      });
      
      return {
        tasks: result.tasks.map(mapTaskToSummary),
        nextCursor: result.nextCursor,
      };
    },
  };
}

function mapProjectToSummary(project: MotionProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    workspaceId: project.workspaceId,
    createdAt: project.createdTime,
    updatedAt: project.updatedTime,
  };
}

function mapTaskToSummary(task: MotionTask): TaskSummary {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    status: motionStatusToString(task.status) as TaskSummary['status'],
    priority: task.priority,
    projectId: task.projectId,
    workspaceId: task.workspaceId,
    assigneeId: task.assigneeId,
    dueDate: task.deadline,  // MotionTask uses deadline not dueDate
    createdAt: task.createdTime,
    updatedAt: task.updatedTime,
  };
}