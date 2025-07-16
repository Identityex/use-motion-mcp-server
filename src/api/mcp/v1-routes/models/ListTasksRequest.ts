// Generated model: ListTasksRequest
// This file is auto-generated. Do not edit manually.




export interface ListTasksRequest {
  projectId?: string;
  workspaceId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigneeId?: string;
  limit?: number;
  cursor?: string;
}
