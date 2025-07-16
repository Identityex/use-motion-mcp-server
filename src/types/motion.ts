// Motion API Types

export interface MotionWorkspace {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

export interface MotionProject {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly status?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MotionTask {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: string;
  readonly priority: string;
  readonly projectId?: string;
  readonly workspaceId: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MotionUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface MotionComment {
  readonly id: string;
  readonly content: string;
  readonly taskId: string;
  readonly userId: string;
  readonly createdAt: string;
}

export interface MotionRecurringTask {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly projectId?: string;
  readonly assigneeId?: string;
  readonly priority: string;
  readonly pattern: string;
}

export interface MotionStatus {
  readonly id: string;
  readonly name: string;
  readonly isDefaultStatus: boolean;
  readonly isResolvedStatus: boolean;
}

export interface CreateProjectRequest {
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly status?: string;
}

export interface CreateTaskRequest {
  readonly name: string;
  readonly description?: string;
  readonly priority?: string;
  readonly projectId?: string;
  readonly workspaceId: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
}

export interface UpdateTaskRequest {
  readonly name?: string;
  readonly description?: string;
  readonly status?: string;
  readonly priority?: string;
  readonly assigneeId?: string;
  readonly dueDate?: string;
}

export interface CreateRecurringTaskRequest {
  readonly name: string;
  readonly description?: string;
  readonly workspaceId: string;
  readonly projectId?: string;
  readonly assigneeId?: string;
  readonly priority?: string;
  readonly pattern: string;
}

export interface CreateCommentRequest {
  readonly content: string;
  readonly taskId: string;
}

export interface ListResponse<T> {
  readonly tasks?: T[];
  readonly projects?: T[];
  readonly recurringTasks?: T[];
  readonly meta?: {
    readonly pageInfo?: {
      readonly cursor?: string;
      readonly hasMore: boolean;
    };
  };
}

export interface MotionApiError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}