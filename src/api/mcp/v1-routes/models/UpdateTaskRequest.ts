// Generated model: UpdateTaskRequest
// This file is auto-generated. Do not edit manually.




export interface UpdateTaskRequest {
  taskId: string;
  name?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string;
  enrich?: boolean;
}
