import axios, { AxiosInstance, AxiosResponse } from 'axios';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import {
  MotionWorkspace,
  MotionProject,
  MotionTask,
  MotionUser,
  MotionComment,
  MotionRecurringTask,
  MotionStatus,
  CreateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateRecurringTaskRequest,
  CreateCommentRequest,
  ListResponse,
  MotionApiError,
} from '../../types/motion-api';

export interface MotionClientConfig {
  apiKey: string;
  baseUrl?: string;
  isTeamAccount?: boolean;
  timeout?: number;
}

export class MotionClient {
  private readonly http: AxiosInstance;
  private readonly queue: PQueue;
  private readonly isTeamAccount: boolean;

  constructor(config: MotionClientConfig) {
    this.isTeamAccount = config.isTeamAccount ?? false;
    
    this.http = axios.create({
      baseURL: config.baseUrl ?? 'https://api.usemotion.com/v1',
      timeout: config.timeout ?? 30000,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    const requestsPerMinute = this.isTeamAccount ? 120 : 12;
    const intervalMs = 60000 / requestsPerMinute;

    this.queue = new PQueue({
      interval: intervalMs,
      intervalCap: 1,
      concurrency: 1,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const motionError: MotionApiError = {
            error: error.response.data?.error || 'Unknown error',
            message: error.response.data?.message || error.message,
            statusCode: error.response.status,
          };
          throw motionError;
        }
        throw error;
      }
    );
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    const result = await this.queue.add(async () => {
      return pRetry(
        async () => {
          const response: AxiosResponse<T> = await this.http.request({
            method,
            url: endpoint,
            data,
            params,
          });
          return response.data;
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
          onFailedAttempt: (error) => {
            if ('statusCode' in error) {
              const statusCode = (error as any).statusCode;
              if (statusCode === 429) {
                throw error;
              }
              if (statusCode && statusCode >= 500) {
                return;
              }
            }
            throw error;
          },
        }
      );
    });
    
    if (result === undefined) {
      throw new Error('Queue returned undefined result');
    }
    
    return result;
  }

  async getWorkspaces(): Promise<MotionWorkspace[]> {
    const response = await this.makeRequest<{ workspaces: MotionWorkspace[] }>('GET', '/workspaces');
    return response.workspaces;
  }

  async getWorkspaceStatuses(workspaceId: string): Promise<MotionStatus[]> {
    const response = await this.makeRequest<{ statuses: MotionStatus[] }>(
      'GET',
      `/workspaces/${workspaceId}/statuses`
    );
    return response.statuses;
  }

  async getCurrentUser(): Promise<MotionUser> {
    return this.makeRequest<MotionUser>('GET', '/users/me');
  }

  async getUsers(workspaceId?: string): Promise<MotionUser[]> {
    const params = workspaceId ? { workspaceId } : undefined;
    const response = await this.makeRequest<{ users: MotionUser[] }>('GET', '/users', undefined, params);
    return response.users;
  }

  async listProjects(params?: {
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<ListResponse<MotionProject>> {
    return this.makeRequest<ListResponse<MotionProject>>('GET', '/projects', undefined, params);
  }

  async getProject(projectId: string): Promise<MotionProject> {
    return this.makeRequest<MotionProject>('GET', `/projects/${projectId}`);
  }

  async createProject(project: CreateProjectRequest): Promise<MotionProject> {
    return this.makeRequest<MotionProject>('POST', '/projects', project);
  }

  async listTasks(params?: {
    workspaceId?: string;
    projectId?: string;
    assigneeId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<ListResponse<MotionTask>> {
    return this.makeRequest<ListResponse<MotionTask>>('GET', '/tasks', undefined, params);
  }

  async getTask(taskId: string): Promise<MotionTask> {
    return this.makeRequest<MotionTask>('GET', `/tasks/${taskId}`);
  }

  async createTask(task: CreateTaskRequest): Promise<MotionTask> {
    return this.makeRequest<MotionTask>('POST', '/tasks', task);
  }

  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<MotionTask> {
    return this.makeRequest<MotionTask>('PATCH', `/tasks/${taskId}`, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.makeRequest<void>('DELETE', `/tasks/${taskId}`);
  }

  async moveTask(taskId: string, projectId: string | null): Promise<MotionTask> {
    return this.makeRequest<MotionTask>('PATCH', `/tasks/${taskId}/move`, { projectId });
  }

  async unassignTask(taskId: string): Promise<MotionTask> {
    return this.makeRequest<MotionTask>('PATCH', `/tasks/${taskId}/unassign`);
  }

  async listRecurringTasks(params?: {
    workspaceId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<ListResponse<MotionRecurringTask>> {
    return this.makeRequest<ListResponse<MotionRecurringTask>>('GET', '/recurring-tasks', undefined, params);
  }

  async getRecurringTask(recurringTaskId: string): Promise<MotionRecurringTask> {
    return this.makeRequest<MotionRecurringTask>('GET', `/recurring-tasks/${recurringTaskId}`);
  }

  async createRecurringTask(recurringTask: CreateRecurringTaskRequest): Promise<MotionRecurringTask> {
    return this.makeRequest<MotionRecurringTask>('POST', '/recurring-tasks', recurringTask);
  }

  async deleteRecurringTask(recurringTaskId: string): Promise<void> {
    await this.makeRequest<void>('DELETE', `/recurring-tasks/${recurringTaskId}`);
  }

  async listComments(params: { taskId?: string; projectId?: string }): Promise<MotionComment[]> {
    const response = await this.makeRequest<{ comments: MotionComment[] }>('GET', '/comments', undefined, params);
    return response.comments;
  }

  async createComment(comment: CreateCommentRequest): Promise<MotionComment> {
    return this.makeRequest<MotionComment>('POST', '/comments', comment);
  }

  async getQueueStatus(): Promise<{ waiting: number; pending: number }> {
    return {
      waiting: this.queue.size,
      pending: this.queue.pending,
    };
  }

  async waitForQueue(): Promise<void> {
    await this.queue.onIdle();
  }
}