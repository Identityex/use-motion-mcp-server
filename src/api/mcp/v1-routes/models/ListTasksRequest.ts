// Generated model: ListTasksRequest
// This file is auto-generated. Do not edit manually.




export interface ListTasksRequest {
  projectId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  limit?: number;
  cursor?: string;
}
