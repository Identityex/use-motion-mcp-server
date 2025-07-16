// Centralized mock factory for Motion MCP Server tests
// Follows the pattern from work-stable-api

import { MotionClient } from '../../src/motion/client';
import { StorageManager } from '../../src/storage/manager';
import { AITaskEnhancer } from '../../src/utils/ai-enhancer';

// Mock implementations that can be configured per test
export const createMockMotionClient = (): jest.Mocked<MotionClient> => ({
  getWorkspaces: jest.fn().mockRejectedValue(new Error('getWorkspaces not implemented in mock')),
  getWorkspaceStatuses: jest.fn().mockRejectedValue(new Error('getWorkspaceStatuses not implemented in mock')),
  getCurrentUser: jest.fn().mockRejectedValue(new Error('getCurrentUser not implemented in mock')),
  getUsers: jest.fn().mockRejectedValue(new Error('getUsers not implemented in mock')),
  listProjects: jest.fn().mockRejectedValue(new Error('listProjects not implemented in mock')),
  getProject: jest.fn().mockRejectedValue(new Error('getProject not implemented in mock')),
  createProject: jest.fn().mockRejectedValue(new Error('createProject not implemented in mock')),
  listTasks: jest.fn().mockRejectedValue(new Error('listTasks not implemented in mock')),
  getTask: jest.fn().mockRejectedValue(new Error('getTask not implemented in mock')),
  createTask: jest.fn().mockRejectedValue(new Error('createTask not implemented in mock')),
  updateTask: jest.fn().mockRejectedValue(new Error('updateTask not implemented in mock')),
  deleteTask: jest.fn().mockRejectedValue(new Error('deleteTask not implemented in mock')),
  moveTask: jest.fn().mockRejectedValue(new Error('moveTask not implemented in mock')),
  unassignTask: jest.fn().mockRejectedValue(new Error('unassignTask not implemented in mock')),
  listRecurringTasks: jest.fn().mockRejectedValue(new Error('listRecurringTasks not implemented in mock')),
  getRecurringTask: jest.fn().mockRejectedValue(new Error('getRecurringTask not implemented in mock')),
  createRecurringTask: jest.fn().mockRejectedValue(new Error('createRecurringTask not implemented in mock')),
  deleteRecurringTask: jest.fn().mockRejectedValue(new Error('deleteRecurringTask not implemented in mock')),
  listComments: jest.fn().mockRejectedValue(new Error('listComments not implemented in mock')),
  createComment: jest.fn().mockRejectedValue(new Error('createComment not implemented in mock')),
  getQueueStatus: jest.fn().mockResolvedValue({ waiting: 0, pending: 0 }),
  waitForQueue: jest.fn().mockResolvedValue(undefined),
}) as jest.Mocked<MotionClient>;

export const createMockStorageManager = (): jest.Mocked<StorageManager> => ({
  ensureDirectories: jest.fn().mockRejectedValue(new Error('ensureDirectories not implemented in mock')),
  bindProject: jest.fn().mockRejectedValue(new Error('bindProject not implemented in mock')),
  unbindProject: jest.fn().mockRejectedValue(new Error('unbindProject not implemented in mock')),
  getProjectMeta: jest.fn().mockRejectedValue(new Error('getProjectMeta not implemented in mock')),
  listBoundProjects: jest.fn().mockRejectedValue(new Error('listBoundProjects not implemented in mock')),
  saveTask: jest.fn().mockRejectedValue(new Error('saveTask not implemented in mock')),
  getTask: jest.fn().mockRejectedValue(new Error('getTask not implemented in mock')),
  listTasks: jest.fn().mockRejectedValue(new Error('listTasks not implemented in mock')),
  deleteTask: jest.fn().mockRejectedValue(new Error('deleteTask not implemented in mock')),
  saveProjectContext: jest.fn().mockRejectedValue(new Error('saveProjectContext not implemented in mock')),
  getProjectContext: jest.fn().mockRejectedValue(new Error('getProjectContext not implemented in mock')),
  saveProjectDoc: jest.fn().mockRejectedValue(new Error('saveProjectDoc not implemented in mock')),
  getProjectDoc: jest.fn().mockRejectedValue(new Error('getProjectDoc not implemented in mock')),
  listProjectDocs: jest.fn().mockRejectedValue(new Error('listProjectDocs not implemented in mock')),
  searchTasks: jest.fn().mockRejectedValue(new Error('searchTasks not implemented in mock')),
}) as jest.Mocked<StorageManager>;

// Mock the entire AITaskEnhancer class since it only has static methods
export const createMockAITaskEnhancer = () => ({
  enrichTask: jest.fn().mockImplementation(() => {
    throw new Error('enrichTask not implemented in mock');
  }),
  breakdownGoalIntoTasks: jest.fn().mockImplementation(() => {
    throw new Error('breakdownGoalIntoTasks not implemented in mock');
  }),
  analyzeTaskPatterns: jest.fn().mockImplementation(() => {
    throw new Error('analyzeTaskPatterns not implemented in mock');
  }),
});

// Factory function to create complete mock suite
export const createMockServices = () => ({
  motionClient: createMockMotionClient(),
  storageManager: createMockStorageManager(),
  aiTaskEnhancer: createMockAITaskEnhancer(),
});

// Type helper for mock services
export type MockServices = ReturnType<typeof createMockServices>;