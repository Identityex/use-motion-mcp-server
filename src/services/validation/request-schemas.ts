// Request validation schemas for MCP tools
// Provides comprehensive validation for all incoming requests

import { z } from 'zod';
import { validators } from './validators';

// Project request schemas
export const listProjectsRequestSchema = z.object({
  workspaceId: validators.workspaceId.optional(),
  limit: validators.limit.optional(),
  cursor: validators.cursor.optional(),
});

export const createProjectRequestSchema = z.object({
  name: validators.name,
  description: validators.description.optional(),
  workspaceId: validators.workspaceId.optional(),
  status: z.string().optional(),
});

export const bindProjectRequestSchema = z.object({
  projectId: validators.projectId,
});

export const syncProjectRequestSchema = z.object({
  projectId: validators.projectId,
});

// Task request schemas
export const createTaskRequestSchema = z.object({
  name: validators.name,
  description: validators.description.optional(),
  priority: validators.priority.optional(),
  enrich: z.boolean().optional(),
  projectId: validators.projectId.optional(),
  duration: z.number().int().min(0).optional(),
  dueDate: validators.date.optional(),
});

export const batchCreateTasksRequestSchema = z.object({
  goal: z.string().min(1, 'Goal is required').max(1000, 'Goal too long'),
  projectId: validators.projectId,
  maxTasks: z.number().int().min(1).max(20).optional(),
  context: z.string().max(5000).optional(),
});

export const listTasksRequestSchema = z.object({
  projectId: validators.projectId.optional(),
  workspaceId: validators.workspaceId.optional(),
  assigneeId: validators.userId.optional(),
  status: validators.status.optional(),
  limit: validators.limit.optional(),
  cursor: validators.cursor.optional(),
});

export const searchTasksRequestSchema = z.object({
  projectName: validators.name.optional(),
  taskName: validators.name.optional(),
  context: z.string().max(10000).optional(),
});

export const updateTaskRequestSchema = z.object({
  taskId: validators.taskId,
  name: validators.name.optional(),
  description: validators.description.optional(),
  status: validators.status.optional(),
  priority: validators.priority.optional(),
  duration: z.number().int().min(0).optional(),
  dueDate: validators.date.optional(),
});

export const completeTaskRequestSchema = z.object({
  taskId: validators.taskId,
});

export const moveTaskRequestSchema = z.object({
  taskId: validators.taskId,
  projectId: validators.projectId,
});

export const enrichTaskRequestSchema = z.object({
  taskId: validators.taskId,
  context: z.string().max(10000).optional(),
});

export const analyzeTaskRequestSchema = z.object({
  taskId: validators.taskId,
  context: z.string().max(10000).optional(),
});

// Workflow request schemas
export const planWorkflowRequestSchema = z.object({
  goal: z.string().min(1).max(1000),
  context: z.string().max(10000).optional(),
  projectId: validators.projectId.optional(),
});

// Sync request schemas
export const syncAllRequestSchema = z.object({
  force: z.boolean().optional(),
});

export const checkSyncRequestSchema = z.object({
  projectId: validators.projectId.optional(),
});

// Context request schemas
export const saveContextRequestSchema = z.object({
  projectId: validators.projectId,
  context: z.string().max(100000), // Allow larger context
});

export const loadContextRequestSchema = z.object({
  projectId: validators.projectId,
});

// Docs request schemas
export const createDocsRequestSchema = z.object({
  projectId: validators.projectId,
  template: z.enum(['readme', 'api', 'architecture']).optional(),
});

export const updateDocsRequestSchema = z.object({
  projectId: validators.projectId,
  fileName: validators.fileName,
  content: z.string().max(100000),
});

export const statusReportRequestSchema = z.object({
  projectId: validators.projectId.optional(),
  format: z.enum(['markdown', 'json']).optional().default('markdown'),
});

// Type exports for validated requests
export type ListProjectsRequest = z.infer<typeof listProjectsRequestSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type BindProjectRequest = z.infer<typeof bindProjectRequestSchema>;
export type SyncProjectRequest = z.infer<typeof syncProjectRequestSchema>;

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;
export type BatchCreateTasksRequest = z.infer<typeof batchCreateTasksRequestSchema>;
export type ListTasksRequest = z.infer<typeof listTasksRequestSchema>;
export type SearchTasksRequest = z.infer<typeof searchTasksRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>;
export type CompleteTaskRequest = z.infer<typeof completeTaskRequestSchema>;
export type MoveTaskRequest = z.infer<typeof moveTaskRequestSchema>;
export type EnrichTaskRequest = z.infer<typeof enrichTaskRequestSchema>;
export type AnalyzeTaskRequest = z.infer<typeof analyzeTaskRequestSchema>;

export type PlanWorkflowRequest = z.infer<typeof planWorkflowRequestSchema>;
export type SyncAllRequest = z.infer<typeof syncAllRequestSchema>;
export type CheckSyncRequest = z.infer<typeof checkSyncRequestSchema>;
export type SaveContextRequest = z.infer<typeof saveContextRequestSchema>;
export type LoadContextRequest = z.infer<typeof loadContextRequestSchema>;
export type CreateDocsRequest = z.infer<typeof createDocsRequestSchema>;
export type UpdateDocsRequest = z.infer<typeof updateDocsRequestSchema>;
export type StatusReportRequest = z.infer<typeof statusReportRequestSchema>;