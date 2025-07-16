// Motion API Service
// External service integration for Motion task management API

import { MotionClient } from './client';

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Task {
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

export interface ListProjectsParams {
  readonly workspaceId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface CreateProjectParams {
  readonly name: string;
  readonly description?: string;
  readonly workspaceId?: string;
}

export interface ListTasksParams {
  readonly projectId?: string;
  readonly workspaceId?: string;
  readonly status?: Task['status'];
  readonly assigneeId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface CreateTaskParams {
  readonly name: string;
  readonly description?: string;
  readonly priority?: Task['priority'];
  readonly projectId?: string;
  readonly workspaceId?: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
}

export interface UpdateTaskParams {
  readonly taskId: string;
  readonly name?: string;
  readonly description?: string;
  readonly status?: Task['status'];
  readonly priority?: Task['priority'];
  readonly assigneeId?: string;
  readonly dueDate?: string;
}

export interface MotionService {
  readonly listProjects: (params: ListProjectsParams) => Promise<Project[]>;
  readonly createProject: (params: CreateProjectParams) => Promise<Project>;
  readonly listTasks: (params: ListTasksParams) => Promise<Task[]>;
  readonly createTask: (params: CreateTaskParams) => Promise<Task>;
  readonly updateTask: (params: UpdateTaskParams) => Promise<Task>;
}

export function createMotionService(deps: {
  readonly client: MotionClient;
}): MotionService {
  return {
    listProjects: async (params) => {
      const projects = await deps.client.listProjects(params);
      return projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        workspaceId: p.workspaceId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    },

    createProject: async (params) => {
      const project = await deps.client.createProject({
        name: params.name,
        description: params.description,
        workspaceId: params.workspaceId,
      });
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        workspaceId: project.workspaceId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    },

    listTasks: async (params) => {
      const response = await deps.client.listTasks(params);
      const tasks = response.tasks || [];
      return tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        priority: t.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        projectId: t.projectId,
        workspaceId: t.workspaceId,
        assigneeId: t.assigneeId,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    },

    createTask: async (params) => {
      const task = await deps.client.createTask({
        name: params.name,
        description: params.description,
        priority: params.priority,
        projectId: params.projectId,
        workspaceId: params.workspaceId,
        assigneeId: params.assigneeId,
        dueDate: params.dueDate,
      });
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        projectId: task.projectId,
        workspaceId: task.workspaceId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    },

    updateTask: async (params) => {
      const { taskId, ...updateData } = params;
      const task = await deps.client.updateTask(taskId, updateData);
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        projectId: task.projectId,
        workspaceId: task.workspaceId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    },
  };
}