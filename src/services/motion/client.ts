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
  CreateRecurringTaskRequest,
  CreateCommentRequest,
  ListResponse,
  MotionApiError,
} from '../../types/motion-api';
import { UpdateTaskRequest } from '../../types/motion';
import { createDomainLogger, PerformanceLogger } from '../utils/logger';
import { rateLimitTracker } from './rate-limiter';

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
  private readonly logger = createDomainLogger('motion-client');

  constructor(config: MotionClientConfig) {
    this.isTeamAccount = config.isTeamAccount ?? false;
    
    this.logger.info('Initializing Motion client', {
      isTeamAccount: this.isTeamAccount,
      baseUrl: config.baseUrl ?? 'https://api.usemotion.com/v1',
    });
    
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
    // Request interceptor for logging
    this.http.interceptors.request.use(
      (config) => {
        this.logger.debug('Motion API request', {
          method: config.method,
          url: config.url,
          params: config.params,
          // Don't log request body as it might contain sensitive data
          hasBody: !!config.data,
        });
        return config;
      },
      (error) => {
        this.logger.error('Motion API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.http.interceptors.response.use(
      (response) => {
        this.logger.debug('Motion API response', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          // Don't log response data as it might contain sensitive information
        });
        
        // Track rate limit headers
        if (response.headers) {
          const endpoint = response.config.url || '';
          rateLimitTracker.updateFromHeaders(endpoint, response.headers as any);
        }
        
        return response;
      },
      (error) => {
        if (error.response) {
          const motionError: MotionApiError = {
            error: error.response.data?.error || 'Unknown error',
            message: error.response.data?.message || error.message,
            statusCode: error.response.status,
          };
          
          this.logger.error('Motion API error response', {
            method: error.config?.method,
            url: error.config?.url,
            status: error.response.status,
            error: motionError.error,
            message: motionError.message,
          });
          
          throw motionError;
        }
        
        this.logger.error('Motion API network error', {
          error: error.message,
          code: error.code,
        });
        
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
    const perfLog = new PerformanceLogger(this.logger, `${method} ${endpoint}`);
    
    // Check if we should delay due to rate limits
    const delayInfo = rateLimitTracker.shouldDelay(endpoint);
    if (delayInfo.delay && delayInfo.waitMs) {
      this.logger.info('Delaying request due to rate limit', {
        endpoint,
        waitMs: delayInfo.waitMs,
      });
      await new Promise(resolve => setTimeout(resolve, delayInfo.waitMs));
    }
    
    try {
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
                  this.logger.warn('Rate limit hit, not retrying', { endpoint });
                  throw error;
                }
                if (statusCode && statusCode >= 500) {
                  this.logger.warn('Server error, will retry', { endpoint, statusCode });
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
    
    perfLog.end({ queueSize: this.queue.size });
    return result;
  } catch (error) {
    perfLog.error(error);
    throw error;
  }
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

  async getRateLimitStatus(): Promise<{
    queueStatus: { waiting: number; pending: number };
    rateLimits: Record<string, { percentUsed: number; remaining: number; resetIn: number }>;
  }> {
    return {
      queueStatus: await this.getQueueStatus(),
      rateLimits: rateLimitTracker.getSummary(),
    };
  }
}