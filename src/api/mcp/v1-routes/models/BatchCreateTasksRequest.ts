// Generated model: BatchCreateTasksRequest
// This file is auto-generated. Do not edit manually.




export interface BatchCreateTasksRequest {
  goal: string;
  context?: string;
  projectId?: string;
  workspaceId?: string;
  maxTasks?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
