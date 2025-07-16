// Generated model: CreateTaskRequest
// This file is auto-generated. Do not edit manually.




export interface CreateTaskRequest {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  workspaceId?: string;
  assigneeId?: string;
  dueDate?: string;
  enrich?: boolean;
}
