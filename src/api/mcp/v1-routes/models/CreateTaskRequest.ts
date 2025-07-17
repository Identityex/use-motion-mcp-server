// Generated model: CreateTaskRequest
// This file is auto-generated. Do not edit manually.




export interface CreateTaskRequest {
  name: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  enrich?: boolean;
  projectId?: string;
  duration?: number;
  dueDate?: string;
}
