// Storage Service
// Manages local file storage for projects and tasks

import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import { 
  MotionProject, 
  MotionTask
} from '../../api/mcp/v1-routes/models';
import { motionStatusToString, mapTaskForMCP } from '../utils/type-mappers';
import { validateProjectId, validateTaskId, validateFileName } from '../validation/validators';

export interface StorageConfig {
  readonly baseDir: string;
}

export interface TaskFile {
  metadata: TaskMetadata;
  content: string;
}

export interface TaskMetadata extends Omit<MotionTask, 'id'> {
  id: string;
  syncedAt?: string;
  localModifiedAt?: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  boundAt: string;
  lastSyncedAt?: string;
}

export interface StorageService {
  // Project operations
  bindProject(project: MotionProject): Promise<void>;
  unbindProject(projectId: string): Promise<void>;
  getProjectMeta(projectId: string): Promise<ProjectMeta | null>;
  updateProjectMeta(projectId: string, updates: Partial<ProjectMeta>): Promise<void>;
  listBoundProjects(): Promise<ProjectMeta[]>;
  
  // Task operations
  saveTask(projectId: string, task: MotionTask): Promise<void>;
  getTask(projectId: string, taskId: string): Promise<TaskFile | null>;
  listTasks(projectId: string): Promise<TaskFile[]>;
  deleteTask(projectId: string, taskId: string): Promise<void>;
  searchTaskFiles(query: string): Promise<Array<{ projectId: string; task: TaskFile }>>;
  listTasksAsMotionTasks(projectId: string): Promise<MotionTask[]>;
  searchTasks(params: {
    projectId?: string;
    query?: string;
    status?: string;
    limit?: number;
  }): Promise<MotionTask[]>;
  
  // Document operations
  saveDocument(projectId: string, filename: string, content: string): Promise<void>;
  getDocument(projectId: string, filename: string): Promise<string | null>;
  listDocuments(projectId: string): Promise<string[]>;
  
  // Context operations
  saveProjectContext(projectId: string, context: string): Promise<void>;
  loadProjectContext(projectId: string): Promise<string | null>;
}

// Factory function to create StorageService (FRP pattern)
export function createStorageService(config: StorageConfig): StorageService {
  let initialized = false;

  async function ensureInitialized(): Promise<void> {
    if (!initialized) {
      await fs.ensureDir(config.baseDir);
      initialized = true;
    }
  }

  function getProjectDir(projectId: string): string {
    return path.join(config.baseDir, projectId);
  }

  function getTaskPath(projectId: string, taskId: string): string {
    return path.join(getProjectDir(projectId), 'tasks', `${taskId}.md`);
  }

  function getDocPath(projectId: string, filename: string): string {
    return path.join(getProjectDir(projectId), 'docs', filename);
  }

  function getContextPath(projectId: string): string {
    return path.join(getProjectDir(projectId), 'context.md');
  }

  const storage: StorageService = {
    // Project operations
    async bindProject(project: MotionProject): Promise<void> {
      await ensureInitialized();
      
      // Validate project ID to prevent path traversal
      const validatedId = validateProjectId(project.id);
      
      const projectDir = getProjectDir(validatedId);
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'tasks'));
      await fs.ensureDir(path.join(projectDir, 'docs'));

      const meta: ProjectMeta = {
        id: validatedId,
        name: project.name,
        description: project.description,
        workspaceId: project.workspaceId,
        boundAt: new Date().toISOString(),
      };

      await fs.writeJson(path.join(projectDir, 'meta.json'), meta, { spaces: 2 });
    },

    async unbindProject(projectId: string): Promise<void> {
      const validatedId = validateProjectId(projectId);
      const projectDir = getProjectDir(validatedId);
      await fs.remove(projectDir);
    },

    async getProjectMeta(projectId: string): Promise<ProjectMeta | null> {
      const validatedId = validateProjectId(projectId);
      const metaPath = path.join(getProjectDir(validatedId), 'meta.json');
      if (await fs.pathExists(metaPath)) {
        return fs.readJson(metaPath);
      }
      return null;
    },

    async updateProjectMeta(projectId: string, updates: Partial<ProjectMeta>): Promise<void> {
      const validatedId = validateProjectId(projectId);
      const projectMeta = await storage.getProjectMeta(validatedId);
      if (!projectMeta) {
        throw new Error(`Project not found`);
      }
      
      const updated = { ...projectMeta, ...updates };
      const metaPath = path.join(getProjectDir(validatedId), 'meta.json');
      await fs.writeJson(metaPath, updated, { spaces: 2 });
    },

    async listBoundProjects(): Promise<ProjectMeta[]> {
      await ensureInitialized();
      
      const projects: ProjectMeta[] = [];
      if (!await fs.pathExists(config.baseDir)) {
        return projects;
      }
      
      const entries = await fs.readdir(config.baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metaPath = path.join(config.baseDir, entry.name, 'meta.json');
          if (await fs.pathExists(metaPath)) {
            try {
              const meta = await fs.readJson(metaPath);
              projects.push(meta);
            } catch (error) {
              // Skip invalid project directories
              console.warn(`Skipping invalid project directory: ${entry.name}`, error);
            }
          }
        }
      }
      
      return projects;
    },

    // Task operations  
    async saveTask(projectId: string, task: MotionTask): Promise<void> {
      await ensureInitialized();
      
      const validatedProjectId = validateProjectId(projectId);
      const validatedTaskId = validateTaskId(task.id);
      
      const taskPath = getTaskPath(validatedProjectId, validatedTaskId);
      await fs.ensureDir(path.dirname(taskPath));

      const metadata: TaskMetadata = {
        ...task,
        id: validatedTaskId,
        syncedAt: new Date().toISOString(),
      };

      const fileContent = matter.stringify('', metadata);
      await fs.writeFile(taskPath, fileContent, 'utf8');
    },

    async getTask(projectId: string, taskId: string): Promise<TaskFile | null> {
      const validatedProjectId = validateProjectId(projectId);
      const validatedTaskId = validateTaskId(taskId);
      
      const taskPath = getTaskPath(validatedProjectId, validatedTaskId);
      if (!(await fs.pathExists(taskPath))) {
        return null;
      }

      const fileContent = await fs.readFile(taskPath, 'utf8');
      const parsed = matter(fileContent);
      
      return {
        metadata: parsed.data as TaskMetadata,
        content: parsed.content,
      };
    },

    async listTasks(projectId: string): Promise<TaskFile[]> {
      const validatedProjectId = validateProjectId(projectId);
      const tasksDir = path.join(getProjectDir(validatedProjectId), 'tasks');
      
      if (!(await fs.pathExists(tasksDir))) {
        return [];
      }

      const tasks: TaskFile[] = [];
      const files = await fs.readdir(tasksDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const taskId = path.basename(file, '.md');
          const task = await storage.getTask(validatedProjectId, taskId);
          if (task) {
            tasks.push(task);
          }
        }
      }
      
      return tasks;
    },

    async deleteTask(projectId: string, taskId: string): Promise<void> {
      const validatedProjectId = validateProjectId(projectId);
      const validatedTaskId = validateTaskId(taskId);
      
      const taskPath = getTaskPath(validatedProjectId, validatedTaskId);
      await fs.remove(taskPath);
    },

    async searchTaskFiles(query: string): Promise<Array<{ projectId: string; task: TaskFile }>> {
      const results: Array<{ projectId: string; task: TaskFile }> = [];
      const projects = await storage.listBoundProjects();
      
      for (const project of projects) {
        const tasks = await storage.listTasks(project.id);
        for (const task of tasks) {
          const searchContent = `${task.metadata.name} ${task.metadata.description} ${task.content}`.toLowerCase();
          if (searchContent.includes(query.toLowerCase())) {
            results.push({ projectId: project.id, task });
          }
        }
      }
      
      return results;
    },

    async listTasksAsMotionTasks(projectId: string): Promise<MotionTask[]> {
      const taskFiles = await storage.listTasks(projectId);
      return taskFiles.map(file => mapTaskForMCP(file.metadata));
    },

    async searchTasks(params: {
      projectId?: string;
      query?: string;
      status?: string;
      limit?: number;
    }): Promise<MotionTask[]> {
      let tasks: MotionTask[] = [];
      
      if (params.projectId) {
        tasks = await storage.listTasksAsMotionTasks(params.projectId);
      } else {
        const projects = await storage.listBoundProjects();
        for (const project of projects) {
          const projectTasks = await storage.listTasksAsMotionTasks(project.id);
          tasks.push(...projectTasks);
        }
      }
      
      // Apply filters
      if (params.query) {
        const query = params.query.toLowerCase();
        tasks = tasks.filter(task => 
          task.name.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      }
      
      if (params.status) {
        tasks = tasks.filter(task => motionStatusToString(task.status) === params.status);
      }
      
      // Apply limit
      if (params.limit && params.limit > 0) {
        tasks = tasks.slice(0, params.limit);
      }
      
      return tasks;
    },

    // Document operations
    async saveDocument(projectId: string, filename: string, content: string): Promise<void> {
      const validatedProjectId = validateProjectId(projectId);
      const validatedFilename = validateFileName(filename);
      
      const docPath = getDocPath(validatedProjectId, validatedFilename);
      await fs.ensureDir(path.dirname(docPath));
      await fs.writeFile(docPath, content, 'utf8');
    },

    async getDocument(projectId: string, filename: string): Promise<string | null> {
      const validatedProjectId = validateProjectId(projectId);
      const validatedFilename = validateFileName(filename);
      
      const docPath = getDocPath(validatedProjectId, validatedFilename);
      if (await fs.pathExists(docPath)) {
        return fs.readFile(docPath, 'utf8');
      }
      return null;
    },

    async listDocuments(projectId: string): Promise<string[]> {
      const validatedProjectId = validateProjectId(projectId);
      const docsDir = path.join(getProjectDir(validatedProjectId), 'docs');
      
      if (!(await fs.pathExists(docsDir))) {
        return [];
      }

      const files = await fs.readdir(docsDir);
      return files.filter(file => !file.startsWith('.'));
    },

    // Context operations
    async saveProjectContext(projectId: string, context: string): Promise<void> {
      const validatedProjectId = validateProjectId(projectId);
      const contextPath = getContextPath(validatedProjectId);
      await fs.ensureDir(path.dirname(contextPath));
      await fs.writeFile(contextPath, context, 'utf8');
    },

    async loadProjectContext(projectId: string): Promise<string | null> {
      const validatedProjectId = validateProjectId(projectId);
      const contextPath = getContextPath(validatedProjectId);
      if (await fs.pathExists(contextPath)) {
        return fs.readFile(contextPath, 'utf8');
      }
      return null;
    },
  };

  return storage;
}