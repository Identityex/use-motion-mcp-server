// Motion API Types
// Types used by the Motion API client

// Re-export generated types
export * from '../api/mcp/v1-routes/models';

// Additional Motion-specific types
export interface ListResponse<T> {
  data: T[];
  cursor?: string;
}

export interface MotionApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface MotionRecurringTask {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  workspaceId: string;
  frequency: {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  duration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTaskRequest {
  name: string;
  description?: string;
  projectId?: string;
  workspaceId: string;
  frequency: {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  duration: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  labels?: string[];
}

export interface CreateCommentRequest {
  taskId?: string;
  projectId?: string;
  content: string;
}