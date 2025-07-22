import axios, { AxiosInstance } from 'axios';
import {
  MotionWorkspace,
  MotionProject,
  MotionTask,
  MotionUser,
  MotionComment,
  CreateProjectRequest,
  CreateTaskRequest,
  CreateCommentRequest,
  UpdateTaskRequest,
} from '../../types/motion-api.js';
import { createDomainLogger } from '../utils/logger.js';
import { createRateLimitTracker } from './rate-limiter.js';

// Initialize rate limit tracker
const rateLimitTracker = createRateLimitTracker();

export interface MotionClientConfig {
  apiKey: string;
  baseUrl?: string;
  isTeamAccount?: boolean;
  timeout?: number;
}

export interface MotionClient {
  // Workspace operations
  getWorkspaces(): Promise<MotionWorkspace[]>;
  
  // Project operations
  getProjects(workspaceId?: string): Promise<MotionProject[]>;
  createProject(data: CreateProjectRequest): Promise<MotionProject>;
  updateProject(projectId: string, data: Partial<CreateProjectRequest>): Promise<MotionProject>;
  deleteProject(projectId: string): Promise<void>;
  
  // Task operations
  getTasks(workspaceId?: string, projectId?: string): Promise<MotionTask[]>;
  createTask(data: CreateTaskRequest): Promise<MotionTask>;
  updateTask(taskId: string, data: UpdateTaskRequest): Promise<MotionTask>;
  deleteTask(taskId: string): Promise<void>;
  moveTask(taskId: string, projectId: string | null): Promise<MotionTask>;
  
  // User operations
  getUsers(workspaceId?: string): Promise<MotionUser[]>;
  
  // Comment operations
  createComment(params: {
    content: string;
    taskId?: string;
    projectId?: string;
  }): Promise<MotionComment>;
  
  // Queue management
  getQueueStatus(): Promise<{ waiting: number; pending: number }>;
  waitForQueue(): Promise<void>;
}

// Factory function to create MotionClient (FRP pattern)
export async function createMotionClient(config: MotionClientConfig): Promise<MotionClient> {
  // Dynamic imports for ESM modules
  const [{ default: PQueue }, { default: pRetry }] = await Promise.all([
    import('p-queue'),
    import('p-retry')
  ]);
  
  const isTeamAccount = config.isTeamAccount ?? false;
  const logger = createDomainLogger('motion-client');
  
  logger.info('Initializing Motion client', {
    isTeamAccount: isTeamAccount,
    baseUrl: config.baseUrl ?? 'https://api.usemotion.com/v1',
  });
  
  const http = axios.create({
    baseURL: config.baseUrl ?? 'https://api.usemotion.com/v1',
    timeout: config.timeout ?? 30000,
    headers: {
      'X-API-Key': config.apiKey,
      'Content-Type': 'application/json',
    },
  });

  const requestsPerMinute = isTeamAccount ? 120 : 12;
  const intervalMs = 60000 / requestsPerMinute;

  const queue = new PQueue({
    interval: intervalMs,
    intervalCap: 1,
    concurrency: 1,
  });

  // Setup interceptors
  http.interceptors.request.use(
    (config) => {
      logger.debug('Motion API request', {
        method: config.method,
        url: config.url,
        params: config.params,
        // Don't log request body as it might contain sensitive data
        hasBody: !!config.data,
      });
      return config;
    },
    (error) => {
      logger.error('Motion API request error', { error: error.message });
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and logging
  http.interceptors.response.use(
    (response) => {
      logger.debug('Motion API response', {
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
      // Enhanced error logging
      const errorInfo = {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      };
      
      if (error.response?.status === 429) {
        logger.warn('Rate limit exceeded', errorInfo);
        // Track rate limit for better handling
        if (error.response.headers) {
          const endpoint = error.config?.url || '';
          rateLimitTracker.updateFromHeaders(endpoint, error.response.headers as any);
        }
      } else {
        logger.error('Motion API response error', errorInfo);
      }
      
      return Promise.reject(error);
    }
  );

  // Return the interface implementation
  return {
    // Workspace operations
    async getWorkspaces(): Promise<MotionWorkspace[]> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.get<MotionWorkspace[]>('/workspaces'),
          {
            retries: 3,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('getWorkspaces attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    // Project operations
    async getProjects(workspaceId?: string): Promise<MotionProject[]> {
      return (await queue.add(async () => {
        const params = workspaceId ? { workspaceId } : {};
        const response = await pRetry(
          () => http.get<MotionProject[]>('/projects', { params }),
          {
            retries: 3,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('getProjects attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    async createProject(data: CreateProjectRequest): Promise<MotionProject> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.post<MotionProject>('/projects', data),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('createProject attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    async updateProject(projectId: string, data: Partial<CreateProjectRequest>): Promise<MotionProject> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.patch<MotionProject>(`/projects/${projectId}`, data),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('updateProject attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    async deleteProject(projectId: string): Promise<void> {
      await queue.add(async () => {
        await pRetry(
          () => http.delete(`/projects/${projectId}`),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('deleteProject attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
      });
    },

    // Task operations
    async getTasks(workspaceId?: string, projectId?: string): Promise<MotionTask[]> {
      // Debug logging for getTasks
      logger.info('DEBUG: getTasks called', {
        workspaceId: workspaceId ? `${workspaceId.substring(0, 8)}...` : 'undefined',
        projectId: projectId ? `${projectId.substring(0, 8)}...` : 'undefined',
      });
      
      return (await queue.add(async () => {
        const params: any = {};
        if (workspaceId) params.workspaceId = workspaceId;
        if (projectId) params.projectId = projectId;
        
        logger.info('DEBUG: About to make getTasks request', {
          url: '/tasks',
          params: Object.keys(params).reduce((acc, key) => {
            acc[key] = typeof params[key] === 'string' ? `${params[key].substring(0, 8)}...` : params[key];
            return acc;
          }, {} as any)
        });
        
        const response = await pRetry(
          () => http.get<MotionTask[]>('/tasks', { params }),
          {
            retries: 3,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('getTasks attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
                status: error.response?.status,
              });
            },
          }
        );
        
        logger.info('DEBUG: getTasks request successful', {
          taskCount: response.data.length
        });
        
        return response.data;
      }))!;
    },

    async createTask(data: CreateTaskRequest): Promise<MotionTask> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.post<MotionTask>('/tasks', data),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('createTask attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    async updateTask(taskId: string, data: UpdateTaskRequest): Promise<MotionTask> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.patch<MotionTask>(`/tasks/${taskId}`, data),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('updateTask attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    async deleteTask(taskId: string): Promise<void> {
      await queue.add(async () => {
        await pRetry(
          () => http.delete(`/tasks/${taskId}`),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('deleteTask attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
      });
    },

    async moveTask(taskId: string, projectId: string | null): Promise<MotionTask> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.patch<MotionTask>(`/tasks/${taskId}/move`, { projectId }),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('moveTask attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    // User operations
    async getUsers(workspaceId?: string): Promise<MotionUser[]> {
      return (await queue.add(async () => {
        const params = workspaceId ? { workspaceId } : {};
        const response = await pRetry(
          () => http.get<MotionUser[]>('/users', { params }),
          {
            retries: 3,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('getUsers attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    // Comment operations
    async createComment(params: {
      content: string;
      taskId?: string;
      projectId?: string;
    }): Promise<MotionComment> {
      return (await queue.add(async () => {
        const response = await pRetry(
          () => http.post<MotionComment>('/comments', params),
          {
            retries: 2,
            factor: 2,
            onFailedAttempt: (error: any) => {
              logger.warn('createComment attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
              });
            },
          }
        );
        return response.data;
      }))!;
    },

    // Queue management
    async getQueueStatus(): Promise<{ waiting: number; pending: number }> {
      return {
        waiting: queue.size,
        pending: queue.pending,
      };
    },

    async waitForQueue(): Promise<void> {
      await queue.onEmpty();
    },
  };
}