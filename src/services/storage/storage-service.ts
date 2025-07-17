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

export class StorageService {
  private initialized = false;

  constructor(private readonly config: StorageConfig) {}

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await fs.ensureDir(this.config.baseDir);
      this.initialized = true;
    }
  }

  // Project operations
  async bindProject(project: MotionProject): Promise<void> {
    await this.ensureInitialized();
    
    // Validate project ID to prevent path traversal
    const validatedId = validateProjectId(project.id);
    
    const projectDir = this.getProjectDir(validatedId);
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
  }

  async unbindProject(projectId: string): Promise<void> {
    const validatedId = validateProjectId(projectId);
    const projectDir = this.getProjectDir(validatedId);
    await fs.remove(projectDir);
  }

  async getProjectMeta(projectId: string): Promise<ProjectMeta | null> {
    const validatedId = validateProjectId(projectId);
    const metaPath = path.join(this.getProjectDir(validatedId), 'meta.json');
    if (await fs.pathExists(metaPath)) {
      return fs.readJson(metaPath);
    }
    return null;
  }

  async updateProjectMeta(projectId: string, updates: Partial<ProjectMeta>): Promise<void> {
    const validatedId = validateProjectId(projectId);
    const meta = await this.getProjectMeta(validatedId);
    if (!meta) {
      throw new Error(`Project not found`);
    }
    
    const updated = { ...meta, ...updates };
    const metaPath = path.join(this.getProjectDir(validatedId), 'meta.json');
    await fs.writeJson(metaPath, updated, { spaces: 2 });
  }

  async listBoundProjects(): Promise<ProjectMeta[]> {
    await this.ensureInitialized();
    
    const dirs = await fs.readdir(this.config.baseDir);
    const projects: ProjectMeta[] = [];

    for (const dir of dirs) {
      const metaPath = path.join(this.config.baseDir, dir, 'meta.json');
      if (await fs.pathExists(metaPath)) {
        const meta = await fs.readJson(metaPath);
        projects.push(meta);
      }
    }

    return projects;
  }

  // Task operations
  async saveTask(projectId: string, task: MotionTask): Promise<void> {
    const validatedProjectId = validateProjectId(projectId);
    const validatedTaskId = validateTaskId(task.id);
    const taskPath = this.getTaskPath(validatedProjectId, validatedTaskId);
    const taskFile = this.taskToMarkdown(task);
    await fs.writeFile(taskPath, taskFile);
  }

  async getTask(projectId: string, taskId: string): Promise<TaskFile | null> {
    const validatedProjectId = validateProjectId(projectId);
    const validatedTaskId = validateTaskId(taskId);
    const taskPath = this.getTaskPath(validatedProjectId, validatedTaskId);
    if (!await fs.pathExists(taskPath)) {
      return null;
    }

    const content = await fs.readFile(taskPath, 'utf-8');
    const parsed = matter(content);
    
    return {
      metadata: parsed.data as TaskMetadata,
      content: parsed.content,
    };
  }

  async listTasks(projectId: string): Promise<TaskFile[]> {
    const validatedId = validateProjectId(projectId);
    const tasksDir = path.join(this.getProjectDir(validatedId), 'tasks');
    if (!await fs.pathExists(tasksDir)) {
      return [];
    }

    const files = await fs.readdir(tasksDir);
    const tasks: TaskFile[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const taskId = path.basename(file, '.md');
        const task = await this.getTask(projectId, taskId);
        if (task) {
          tasks.push(task);
        }
      }
    }

    return tasks;
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const validatedProjectId = validateProjectId(projectId);
    const validatedTaskId = validateTaskId(taskId);
    const taskPath = this.getTaskPath(validatedProjectId, validatedTaskId);
    await fs.remove(taskPath);
  }

  async searchTaskFiles(query: string): Promise<Array<{ projectId: string; task: TaskFile }>> {
    const results: Array<{ projectId: string; task: TaskFile }> = [];
    const projects = await this.listBoundProjects();

    for (const project of projects) {
      const tasks = await this.listTasks(project.id);
      for (const task of tasks) {
        const searchText = `${task.metadata.name} ${task.metadata.description || ''} ${task.content}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push({ projectId: project.id, task });
        }
      }
    }

    return results;
  }

  // Document operations
  async saveDocument(projectId: string, filename: string, content: string): Promise<void> {
    const validatedProjectId = validateProjectId(projectId);
    const validatedFileName = validateFileName(filename);
    const docPath = path.join(this.getProjectDir(validatedProjectId), 'docs', validatedFileName);
    await fs.writeFile(docPath, content);
  }

  async getDocument(projectId: string, filename: string): Promise<string | null> {
    const validatedProjectId = validateProjectId(projectId);
    const validatedFileName = validateFileName(filename);
    const docPath = path.join(this.getProjectDir(validatedProjectId), 'docs', validatedFileName);
    if (await fs.pathExists(docPath)) {
      return fs.readFile(docPath, 'utf-8');
    }
    return null;
  }

  async listDocuments(projectId: string): Promise<string[]> {
    const validatedId = validateProjectId(projectId);
    const docsDir = path.join(this.getProjectDir(validatedId), 'docs');
    if (!await fs.pathExists(docsDir)) {
      return [];
    }
    
    const files = await fs.readdir(docsDir);
    return files.filter(f => f.endsWith('.md'));
  }

  // Removed duplicate listBoundProjects - using the one that returns ProjectMeta[]

  async listTasksAsMotionTasks(projectId: string): Promise<MotionTask[]> {
    const validatedId = validateProjectId(projectId);
    const taskFiles = await this.listTasks(validatedId);
    return taskFiles.map(tf => this.taskFileToMotionTask(tf));
  }

  async searchTasks(params: {
    query: string;
    projectId?: string;
    status?: string;
  }): Promise<MotionTask[]> {
    const projectMetas = await this.listBoundProjects();
    const projectIds = params.projectId 
      ? [validateProjectId(params.projectId)] 
      : projectMetas.map(p => p.id);
    
    const allTasks: MotionTask[] = [];
    
    for (const projectId of projectIds) {
      const tasks = await this.listTasksAsMotionTasks(projectId);
      
      for (const task of tasks) {
        // Apply filters
        if (params.status && motionStatusToString(task.status) !== params.status) {
          continue;
        }
        
        // Search in name and description
        const searchLower = params.query.toLowerCase();
        const nameMatch = task.name.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower) || false;
        
        if (nameMatch || descMatch) {
          allTasks.push(task);
        }
      }
    }
    
    return allTasks;
  }

  async saveProjectContext(projectId: string, context: string): Promise<void> {
    const validatedId = validateProjectId(projectId);
    const contextPath = path.join(this.getProjectDir(validatedId), 'context.md');
    await fs.writeFile(contextPath, context);
  }

  async loadProjectContext(projectId: string): Promise<string | null> {
    const validatedId = validateProjectId(projectId);
    const contextPath = path.join(this.getProjectDir(validatedId), 'context.md');
    if (await fs.pathExists(contextPath)) {
      return fs.readFile(contextPath, 'utf-8');
    }
    return null;
  }

  // Helper methods
  private getProjectDir(projectId: string): string {
    return path.join(this.config.baseDir, projectId);
  }

  private getTaskPath(projectId: string, taskId: string): string {
    return path.join(this.getProjectDir(projectId), 'tasks', `${taskId}.md`);
  }

  private taskToMarkdown(task: MotionTask): string {
    const metadata: TaskMetadata = {
      ...task,
      localModifiedAt: new Date().toISOString(),
    };

    const content = [];
    
    // Add description if exists
    if (task.description) {
      content.push('## Description');
      content.push(task.description);
      content.push('');
    }

    // Add task details
    content.push('## Task Details');
    content.push(`- **Status**: ${motionStatusToString(task.status)}`);
    content.push(`- **Priority**: ${task.priority}`);
    if (task.assigneeId) {
      content.push(`- **Assignee**: ${task.assigneeId}`);
    }
    if (task.deadline) {
      content.push(`- **Deadline**: ${task.deadline}`);
    }
    if (task.duration) {
      content.push(`- **Duration**: ${task.duration} minutes`);
    }
    content.push('');

    // Add labels if exists
    if (task.labels && task.labels.length > 0) {
      content.push('## Labels');
      content.push(task.labels.map(l => `- ${l}`).join('\n'));
      content.push('');
    }

    return matter.stringify(content.join('\n'), metadata);
  }

  private taskFileToMotionTask(taskFile: TaskFile): MotionTask {
    const metadata = taskFile.metadata;
    return {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      priority: metadata.priority,
      status: metadata.status,
      assigneeId: metadata.assigneeId,
      projectId: metadata.projectId,
      workspaceId: metadata.workspaceId,
      parentRecurringTaskId: metadata.parentRecurringTaskId,
      createdTime: metadata.createdTime,
      updatedTime: metadata.updatedTime,
      scheduledStart: metadata.scheduledStart,
      scheduledEnd: metadata.scheduledEnd,
      deadline: metadata.deadline,
      deadlineType: metadata.deadlineType,
      duration: metadata.duration,
      autoScheduled: metadata.autoScheduled,
      completed: metadata.completed,
      labels: metadata.labels,
      chunks: metadata.chunks,
    };
  }
}

// Factory function for creating storage service
export function createStorageService(config: StorageConfig): StorageService {
  return new StorageService(config);
}