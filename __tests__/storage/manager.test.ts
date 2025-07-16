// Storage Manager Tests
// Follows work-stable-api testing patterns

import * as fs from 'fs-extra';
import * as path from 'path';
import { StorageManager } from '../../src/storage/manager';
import {
  createMockProject,
  createMockTask,
  createMockTaskDocument,
  createMockProjectMeta,
  createMockProjectContext,
} from '../mocks/data-factory';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('StorageManager', () => {
  let storageManager: StorageManager;
  const testBaseDir = '/test/storage';

  beforeEach(() => {
    storageManager = new StorageManager(testBaseDir);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default base directory', () => {
      const defaultManager = new StorageManager();
      expect(defaultManager).toBeInstanceOf(StorageManager);
    });

    it('should initialize with custom base directory', () => {
      const customManager = new StorageManager('/custom/path');
      expect(customManager).toBeInstanceOf(StorageManager);
    });
  });

  describe('ensureDirectories', () => {
    it('should create base and projects directories', async () => {
      mockFs.ensureDir.mockResolvedValue();

      await storageManager.ensureDirectories();

      expect(mockFs.ensureDir).toHaveBeenCalledWith(testBaseDir);
      expect(mockFs.ensureDir).toHaveBeenCalledWith(path.join(testBaseDir, 'projects'));
      expect(mockFs.ensureDir).toHaveBeenCalledTimes(2);
    });

    it('should handle directory creation errors', async () => {
      const error = new Error('Permission denied');
      mockFs.ensureDir.mockRejectedValue(error);

      await expect(storageManager.ensureDirectories()).rejects.toThrow('Permission denied');
    });
  });

  describe('bindProject', () => {
    const mockProject = createMockProject();

    beforeEach(() => {
      mockFs.ensureDir.mockResolvedValue();
      mockFs.writeJson.mockResolvedValue();
    });

    it('should bind project with default path', async () => {
      const result = await storageManager.bindProject(mockProject);

      expect(result).toMatchObject({
        id: mockProject.id,
        name: mockProject.name,
        workspaceId: mockProject.workspaceId,
        isBound: true,
      });
      expect(result.localPath).toContain(mockProject.id);
      expect(result.lastSyncedAt).toBeDefined();
    });

    it('should bind project with custom path', async () => {
      const customPath = '/custom/project/path';
      const result = await storageManager.bindProject(mockProject, customPath);

      expect(result.localPath).toBe(customPath);
    });

    it('should create all required directories', async () => {
      await storageManager.bindProject(mockProject);

      const expectedProjectPath = path.join(testBaseDir, 'projects', mockProject.id);
      expect(mockFs.ensureDir).toHaveBeenCalledWith(expectedProjectPath);
      expect(mockFs.ensureDir).toHaveBeenCalledWith(path.join(expectedProjectPath, 'tasks'));
      expect(mockFs.ensureDir).toHaveBeenCalledWith(path.join(expectedProjectPath, 'docs'));
    });

    it('should save project metadata', async () => {
      await storageManager.bindProject(mockProject);

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('meta.json'),
        expect.objectContaining({
          id: mockProject.id,
          name: mockProject.name,
          isBound: true,
        }),
        { spaces: 2 }
      );
    });
  });

  describe('unbindProject', () => {
    it('should mark project as unbound when meta file exists', async () => {
      const mockMeta = createMockProjectMeta({ isBound: true });
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockMeta);
      mockFs.writeJson.mockResolvedValue();

      await storageManager.unbindProject('proj_123');

      expect(mockFs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('meta.json'),
        expect.objectContaining({ isBound: false }),
        { spaces: 2 }
      );
    });

    it('should handle missing meta file gracefully', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      await expect(storageManager.unbindProject('proj_123')).resolves.toBeUndefined();
      expect(mockFs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('getProjectMeta', () => {
    it('should return null when meta file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const result = await storageManager.getProjectMeta('proj_123');

      expect(result).toBeNull();
    });

    it('should return project meta when file exists', async () => {
      const mockMeta = createMockProjectMeta();
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(mockMeta);

      const result = await storageManager.getProjectMeta('proj_123');

      expect(result).toEqual(mockMeta);
    });

    it('should handle JSON read errors', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockRejectedValue(new Error('Invalid JSON'));

      await expect(storageManager.getProjectMeta('proj_123')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('saveTask', () => {
    const mockTask = createMockTask();
    const projectId = 'proj_123';

    beforeEach(() => {
      mockFs.ensureDir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();
    });

    it('should save task as markdown file', async () => {
      const result = await storageManager.saveTask(projectId, mockTask);

      expect(result).toMatchObject({
        id: mockTask.id,
        name: mockTask.name,
        workspaceId: mockTask.workspaceId,
        status: mockTask.status.name,
        priority: mockTask.priority,
        completed: mockTask.completed,
      });
    });

    it('should create tasks directory', async () => {
      await storageManager.saveTask(projectId, mockTask);

      const expectedTasksPath = path.join(testBaseDir, 'projects', projectId, 'tasks');
      expect(mockFs.ensureDir).toHaveBeenCalledWith(expectedTasksPath);
    });

    it('should write markdown file with correct path', async () => {
      await storageManager.saveTask(projectId, mockTask);

      const expectedFilePath = path.join(testBaseDir, 'projects', projectId, 'tasks', `${mockTask.id}.md`);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expectedFilePath,
        expect.stringContaining(mockTask.name),
        'utf-8'
      );
    });

    it('should include YAML frontmatter in markdown', async () => {
      await storageManager.saveTask(projectId, mockTask);

      const [, content] = mockFs.writeFile.mock.calls[0];
      expect(content).toMatch(/^---\n/); // YAML frontmatter start
      expect(content).toContain(`id: ${mockTask.id}`);
      expect(content).toContain(`status: ${mockTask.status.name}`);
    });
  });

  describe('getTask', () => {
    const projectId = 'proj_123';
    const taskId = 'task_456';

    it('should return null when task file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const result = await storageManager.getTask(projectId, taskId);

      expect(result).toBeNull();
    });

    it('should parse and return task from markdown file', async () => {
      const mockTaskDoc = createMockTaskDocument({ id: taskId });
      const markdownContent = `---
id: ${taskId}
workspaceId: ws_123
status: TODO
priority: MEDIUM
completed: false
---

# Test Task

## Description
Test description
`;

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(markdownContent);

      const result = await storageManager.getTask(projectId, taskId);

      expect(result).toMatchObject({
        id: taskId,
        workspaceId: 'ws_123',
        name: 'Test Task',
        status: 'TODO',
        priority: 'MEDIUM',
        completed: false,
      });
    });
  });

  describe('listTasks', () => {
    const projectId = 'proj_123';

    it('should return empty array when tasks directory does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      const result = await storageManager.listTasks(projectId);

      expect(result).toEqual([]);
    });

    it('should return sorted list of tasks from markdown files', async () => {
      const taskFiles = ['task1.md', 'task2.md', 'other.txt'];
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir.mockResolvedValue(taskFiles);

      // Mock file content for .md files
      mockFs.readFile
        .mockResolvedValueOnce(`---
id: task1
workspaceId: ws_123
updatedTime: 2023-01-01T00:00:00Z
---
# Task 1`)
        .mockResolvedValueOnce(`---
id: task2
workspaceId: ws_123
updatedTime: 2023-01-02T00:00:00Z
---
# Task 2`);

      const result = await storageManager.listTasks(projectId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task2'); // More recent first
      expect(result[1].id).toBe('task1');
    });
  });

  describe('searchTasks', () => {
    const query = 'test search';

    it('should search across all bound projects when no project specified', async () => {
      const mockProjects = [
        createMockProjectMeta({ id: 'proj_1' }),
        createMockProjectMeta({ id: 'proj_2' }),
      ];

      const mockTasks = [
        createMockTaskDocument({ name: 'Test Task', description: 'Contains search term' }),
        createMockTaskDocument({ name: 'Other Task', description: 'No match' }),
      ];

      // Mock listBoundProjects and listTasks
      jest.spyOn(storageManager, 'listBoundProjects').mockResolvedValue(mockProjects);
      jest.spyOn(storageManager, 'listTasks').mockResolvedValue(mockTasks);

      const result = await storageManager.searchTasks(query);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Task');
    });

    it('should search within specific project when project ID provided', async () => {
      const projectId = 'proj_123';
      const mockTasks = [
        createMockTaskDocument({ name: 'Test Task' }),
        createMockTaskDocument({ name: 'Other Task' }),
      ];

      jest.spyOn(storageManager, 'listTasks').mockResolvedValue(mockTasks);

      const result = await storageManager.searchTasks(query, projectId);

      expect(storageManager.listTasks).toHaveBeenCalledWith(projectId);
      expect(result).toHaveLength(1);
    });

    it('should match tasks by labels', async () => {
      const mockTasks = [
        createMockTaskDocument({ labels: ['test', 'important'] }),
        createMockTaskDocument({ labels: ['other', 'label'] }),
      ];

      jest.spyOn(storageManager, 'listBoundProjects').mockResolvedValue([createMockProjectMeta()]);
      jest.spyOn(storageManager, 'listTasks').mockResolvedValue(mockTasks);

      const result = await storageManager.searchTasks('test');

      expect(result).toHaveLength(1);
      expect(result[0].labels).toContain('test');
    });
  });

  describe('project context operations', () => {
    const projectId = 'proj_123';
    const mockContext = createMockProjectContext();

    describe('saveProjectContext', () => {
      it('should save project context as JSON', async () => {
        mockFs.ensureDir.mockResolvedValue();
        mockFs.writeJson.mockResolvedValue();

        await storageManager.saveProjectContext(projectId, mockContext);

        expect(mockFs.writeJson).toHaveBeenCalledWith(
          expect.stringContaining('context.json'),
          mockContext,
          { spaces: 2 }
        );
      });
    });

    describe('getProjectContext', () => {
      it('should return null when context file does not exist', async () => {
        mockFs.pathExists.mockResolvedValue(false);

        const result = await storageManager.getProjectContext(projectId);

        expect(result).toBeNull();
      });

      it('should return context when file exists', async () => {
        mockFs.pathExists.mockResolvedValue(true);
        mockFs.readJson.mockResolvedValue(mockContext);

        const result = await storageManager.getProjectContext(projectId);

        expect(result).toEqual(mockContext);
      });
    });
  });
});