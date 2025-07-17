// Generated MCP Controller: TaskController
// This file is auto-generated. Do not edit manually.

import { MCPToolResponse } from '../models';

/**
 * TaskController - MCP Controller Interface
 */
export interface TaskController {
  /**
   * Create a new task
   */
  createTask: (req: {
    name: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    enrich?: boolean;
    projectId?: string;
    duration?: number;
    dueDate?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Create multiple tasks from goals
   */
  batchCreateTasks: (req: {
    goal: string;
    projectId: string;
    maxTasks?: number;
    context?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * List and filter tasks
   */
  listTasks: (req: {
    projectId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    limit?: number;
    cursor?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Search tasks in local storage
   */
  searchTasks: (req: {
    query: string;
    projectId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }) => Promise<MCPToolResponse>;
  /**
   * Update task properties
   */
  updateTask: (req: {
    taskId: string;
    name?: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    duration?: number;
    dueDate?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Mark tasks as completed
   */
  completeTask: (req: {
    taskId: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Move task to different project
   */
  moveTask: (req: {
    taskId: string;
    targetProjectId: string;
  }) => Promise<MCPToolResponse>;
  /**
   * AI-enhance task descriptions
   */
  enrichTask: (req: {
    taskId: string;
    context?: string;
  }) => Promise<MCPToolResponse>;
  /**
   * Analyze task complexity
   */
  analyzeTask: (req: {
    taskId: string;
  }) => Promise<MCPToolResponse>;
}

/**
 * MCP tool names for Task
 */
export const TaskToolNames = {
  createTask: 'motion.task.create',
  batchCreateTasks: 'motion.task.batch_create',
  listTasks: 'motion.task.list',
  searchTasks: 'motion.task.search',
  updateTask: 'motion.task.update',
  completeTask: 'motion.task.complete',
  moveTask: 'motion.task.move',
  enrichTask: 'motion.task.enrich',
  analyzeTask: 'motion.task.analyze',
} as const;