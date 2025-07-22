// Motion Service
// Simplified service that directly uses the Motion API client

import { createMotionClient, MotionClient } from './motion/client.js';
import {
  MotionProject,
  MotionTask,
  MotionWorkspace,
  MotionUser,
  MotionComment,
  CreateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest as MCPUpdateTaskRequest,
} from '../types/motion-api.js';
import { UpdateTaskRequest as MotionUpdateTaskRequest } from '../types/motion.js';

export interface MotionServiceConfig {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly workspaceId?: string;
  readonly isTeamAccount?: boolean;
}

export interface MotionService {
  // Workspace operations
  listWorkspaces(): Promise<MotionWorkspace[]>;
  
  // Project operations
  listProjects(params?: {
    workspaceId?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<MotionProject[]>;
  
  listProjectsWithPagination(params?: {
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ projects: MotionProject[]; nextCursor?: string }>;
  
  createProject(params: CreateProjectRequest): Promise<MotionProject>;
  
  // Task operations
  listTasks(params?: {
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    assigneeId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<MotionTask[]>;
  
  listTasksWithPagination(params?: {
    workspaceId?: string;
    projectId?: string;
    assigneeId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ tasks: MotionTask[]; nextCursor?: string }>;
  
  createTask(params: CreateTaskRequest): Promise<MotionTask>;
  updateTask(params: MCPUpdateTaskRequest): Promise<MotionTask>;
  deleteTask(taskId: string): Promise<void>;
  moveTask(taskId: string, projectId: string | null): Promise<MotionTask>;
  
  // User operations
  getCurrentUser(): Promise<MotionUser>;
  listUsers(workspaceId?: string): Promise<MotionUser[]>;
  
  // Comment operations
  listComments(params: { taskId?: string; projectId?: string }): Promise<MotionComment[]>;
  createComment(params: {
    content: string;
    taskId?: string;
    projectId?: string;
  }): Promise<MotionComment>;
  
  // Queue management
  getQueueStatus(): Promise<{ waiting: number; pending: number }>;
  waitForQueue(): Promise<void>;
}

// Factory function for dependency injection (FRP pattern)
export async function createMotionService(config: MotionServiceConfig): Promise<MotionService> {
  const client = await createMotionClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    isTeamAccount: config.isTeamAccount,
  });
  
  const defaultWorkspaceId = config.workspaceId;
  
  return {
    // Workspace operations
    async listWorkspaces(): Promise<MotionWorkspace[]> {
      return client.getWorkspaces();
    },

    // Project operations
    async listProjects(params?: {
      workspaceId?: string;
      projectId?: string;
      limit?: number;
      cursor?: string;
    }): Promise<MotionProject[]> {
      // If looking for a specific project by ID, filter after fetching
      const projects = await client.getProjects(
        params?.workspaceId || defaultWorkspaceId
      );
      
      if (params?.projectId) {
        return projects.filter((p: any) => p.id === params.projectId);
      }
      
      return projects;
    },

    async listProjectsWithPagination(params?: {
      workspaceId?: string;
      limit?: number;
      cursor?: string;
    }): Promise<{ projects: MotionProject[]; nextCursor?: string }> {
      const projects = await client.getProjects(
        params?.workspaceId || defaultWorkspaceId
      );
      
      return {
        projects: projects,
        nextCursor: undefined, // Simple client doesn't support pagination
      };
    },

    async createProject(params: CreateProjectRequest): Promise<MotionProject> {
      return client.createProject({
        ...params,
        workspaceId: params.workspaceId || defaultWorkspaceId,
      });
    },

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
      const tasks = await client.getTasks(
        params?.workspaceId || defaultWorkspaceId,
        params?.projectId
      );
      
      let filteredTasks = tasks;
      
      if (params?.taskId) {
        filteredTasks = tasks.filter((t: any) => t.id === params.taskId);
      }
      
      return filteredTasks;
    },

    async listTasksWithPagination(params?: {
      workspaceId?: string;
      projectId?: string;
      assigneeId?: string;
      status?: string;
      limit?: number;
      cursor?: string;
    }): Promise<{ tasks: MotionTask[]; nextCursor?: string }> {
      const tasks = await client.getTasks(
        params?.workspaceId || defaultWorkspaceId,
        params?.projectId
      );
      
      return {
        tasks: tasks,
        nextCursor: undefined, // Simple client doesn't support pagination
      };
    },

    async createTask(params: CreateTaskRequest): Promise<MotionTask> {
      return client.createTask(params);
    },

    async updateTask(params: MCPUpdateTaskRequest): Promise<MotionTask> {
      const { taskId, ...updates } = params;
      return client.updateTask(taskId, updates as any);
    },

    async deleteTask(taskId: string): Promise<void> {
      return client.deleteTask(taskId);
    },

    async moveTask(taskId: string, projectId: string | null): Promise<MotionTask> {
      return client.moveTask(taskId, projectId);
    },

    // User operations
    async getCurrentUser(): Promise<MotionUser> {
      const users = await client.getUsers();
      if (users.length === 0) {
        throw new Error('No users found');
      }
      return users[0]!; // Return first user as current user
    },

    async listUsers(workspaceId?: string): Promise<MotionUser[]> {
      return client.getUsers(workspaceId || defaultWorkspaceId);
    },

    // Comment operations
    async listComments(_params: { taskId?: string; projectId?: string }): Promise<MotionComment[]> {
      // Comments listing not implemented in simple client
      return [];
    },

    async createComment(params: {
      content: string;
      taskId?: string;
      projectId?: string;
    }): Promise<MotionComment> {
      return client.createComment(params);
    },

    // Queue management
    async getQueueStatus(): Promise<{ waiting: number; pending: number }> {
      return client.getQueueStatus();
    },

    async waitForQueue(): Promise<void> {
      return client.waitForQueue();
    },
  };
}