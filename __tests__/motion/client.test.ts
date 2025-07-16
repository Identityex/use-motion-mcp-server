// Motion API Client Tests
// Follows work-stable-api testing patterns

import { MotionClient } from '../../src/motion/client';
import { createMockProject, createMockTask, createMockUser, createMockWorkspace } from '../mocks/data-factory';

// Mock axios
jest.mock('axios');
jest.mock('p-queue');
jest.mock('p-retry');

describe('MotionClient', () => {
  let client: MotionClient;

  beforeEach(() => {
    client = new MotionClient({
      apiKey: 'test-api-key',
      isTeamAccount: false,
    });
  });

  describe('constructor', () => {
    it('should create client with individual account settings', () => {
      const individualClient = new MotionClient({
        apiKey: 'test-key',
        isTeamAccount: false,
      });

      expect(individualClient).toBeInstanceOf(MotionClient);
    });

    it('should create client with team account settings', () => {
      const teamClient = new MotionClient({
        apiKey: 'test-key',
        isTeamAccount: true,
      });

      expect(teamClient).toBeInstanceOf(MotionClient);
    });

    it('should accept custom base URL', () => {
      const customClient = new MotionClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(customClient).toBeInstanceOf(MotionClient);
    });

    it('should accept custom timeout', () => {
      const timeoutClient = new MotionClient({
        apiKey: 'test-key',
        timeout: 60000,
      });

      expect(timeoutClient).toBeInstanceOf(MotionClient);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status with waiting and pending counts', async () => {
      const status = await client.getQueueStatus();

      expect(status).toHaveProperty('waiting');
      expect(status).toHaveProperty('pending');
      expect(typeof status.waiting).toBe('number');
      expect(typeof status.pending).toBe('number');
    });
  });

  describe('waitForQueue', () => {
    it('should resolve when queue is idle', async () => {
      await expect(client.waitForQueue()).resolves.toBeUndefined();
    });
  });

  // Note: Since we're mocking axios, p-queue, and p-retry, the actual HTTP calls
  // and queue management won't be tested here. These would be tested in integration tests
  // with real API endpoints or more sophisticated mocks.

  describe('API methods structure', () => {
    it('should have all required workspace methods', () => {
      expect(typeof client.getWorkspaces).toBe('function');
      expect(typeof client.getWorkspaceStatuses).toBe('function');
    });

    it('should have all required user methods', () => {
      expect(typeof client.getCurrentUser).toBe('function');
      expect(typeof client.getUsers).toBe('function');
    });

    it('should have all required project methods', () => {
      expect(typeof client.listProjects).toBe('function');
      expect(typeof client.getProject).toBe('function');
      expect(typeof client.createProject).toBe('function');
    });

    it('should have all required task methods', () => {
      expect(typeof client.listTasks).toBe('function');
      expect(typeof client.getTask).toBe('function');
      expect(typeof client.createTask).toBe('function');
      expect(typeof client.updateTask).toBe('function');
      expect(typeof client.deleteTask).toBe('function');
      expect(typeof client.moveTask).toBe('function');
      expect(typeof client.unassignTask).toBe('function');
    });

    it('should have all required recurring task methods', () => {
      expect(typeof client.listRecurringTasks).toBe('function');
      expect(typeof client.getRecurringTask).toBe('function');
      expect(typeof client.createRecurringTask).toBe('function');
      expect(typeof client.deleteRecurringTask).toBe('function');
    });

    it('should have all required comment methods', () => {
      expect(typeof client.listComments).toBe('function');
      expect(typeof client.createComment).toBe('function');
    });
  });
});