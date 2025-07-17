// Motion Service
// Simplified service that directly uses the Motion API client

import { MotionClient } from './motion/client';
import {
  MotionProject,
  MotionTask,
  MotionWorkspace,
  MotionUser,
  MotionComment,
  CreateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest as MCPUpdateTaskRequest,
} from '../types/motion-api';
import { UpdateTaskRequest as MotionUpdateTaskRequest } from '../types/motion';

export interface MotionServiceConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly workspaceId?: string;
  readonly isTeamAccount?: boolean;
}

export class MotionService {
  private readonly client: MotionClient;
  private readonly defaultWorkspaceId?: string;

  constructor(config: MotionServiceConfig) {
    this.client = new MotionClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      isTeamAccount: config.isTeamAccount,
    });
    this.defaultWorkspaceId = config.workspaceId;
  }

  // Workspace operations
  async listWorkspaces(): Promise<MotionWorkspace[]> {
    return this.client.getWorkspaces();
  }

  // Project operations
  async listProjects(params?: {
    workspaceId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<MotionProject[]> {
    // If looking for a specific project by ID, filter after fetching
    const response = await this.client.listProjects({
      workspaceId: params?.workspaceId || this.defaultWorkspaceId,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });
    
    if (params?.projectId) {
      return response.data.filter(p => p.id === params.projectId);
    }
    
    return response.data;
  }

  async listProjectsWithPagination(params?: {
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ projects: MotionProject[]; nextCursor?: string }> {
    const response = await this.client.listProjects({
      workspaceId: params?.workspaceId || this.defaultWorkspaceId,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });
    
    return {
      projects: response.data,
      nextCursor: response.cursor,
    };
  }

  async createProject(params: CreateProjectRequest): Promise<MotionProject> {
    return this.client.createProject({
      ...params,
      workspaceId: params.workspaceId || this.defaultWorkspaceId,
    });
  }

  // Task operations
  async listTasks(params?: {
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    assigneeId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<MotionTask[]> {
    // If looking for a specific task by ID, filter after fetching
    const response = await this.client.listTasks({
      workspaceId: params?.workspaceId || this.defaultWorkspaceId,
      projectId: params?.projectId,
      assigneeId: params?.assigneeId,
      status: params?.status,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });
    
    if (params?.taskId) {
      return response.data.filter(t => t.id === params.taskId);
    }
    
    return response.data;
  }

  async listTasksWithPagination(params?: {
    workspaceId?: string;
    projectId?: string;
    assigneeId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ tasks: MotionTask[]; nextCursor?: string }> {
    const response = await this.client.listTasks({
      workspaceId: params?.workspaceId || this.defaultWorkspaceId,
      projectId: params?.projectId,
      assigneeId: params?.assigneeId,
      status: params?.status,
      limit: params?.limit || 100,
      cursor: params?.cursor,
    });
    
    return {
      tasks: response.data,
      nextCursor: response.cursor,
    };
  }

  async createTask(params: CreateTaskRequest): Promise<MotionTask> {
    return this.client.createTask(params);
  }

  async updateTask(params: MCPUpdateTaskRequest): Promise<MotionTask> {
    const { taskId, ...updates } = params;
    return this.client.updateTask(taskId, updates as MotionUpdateTaskRequest);
  }

  async deleteTask(taskId: string): Promise<void> {
    return this.client.deleteTask(taskId);
  }

  async moveTask(taskId: string, projectId: string | null): Promise<MotionTask> {
    return this.client.moveTask(taskId, projectId);
  }

  // User operations
  async getCurrentUser(): Promise<MotionUser> {
    return this.client.getCurrentUser();
  }

  async listUsers(workspaceId?: string): Promise<MotionUser[]> {
    return this.client.getUsers(workspaceId || this.defaultWorkspaceId);
  }

  // Comment operations
  async listComments(params: { taskId?: string; projectId?: string }): Promise<MotionComment[]> {
    return this.client.listComments(params);
  }

  async createComment(params: {
    content: string;
    taskId?: string;
    projectId?: string;
  }): Promise<MotionComment> {
    return this.client.createComment(params);
  }

  // Queue management
  async getQueueStatus(): Promise<{ waiting: number; pending: number }> {
    return this.client.getQueueStatus();
  }

  async waitForQueue(): Promise<void> {
    return this.client.waitForQueue();
  }
}

// Factory function for dependency injection
export function createMotionService(config: MotionServiceConfig): MotionService {
  return new MotionService(config);
}