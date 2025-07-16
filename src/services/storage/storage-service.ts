// Storage Service
// Manages local file storage for projects and tasks

import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import { 
  MotionProject, 
  MotionTask, 
  ProjectID, 
  TaskID 
} from '../../api/mcp/v1-routes/models';

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
  constructor(private readonly config: StorageConfig) {
    // Ensure base directory exists
    fs.ensureDirSync(this.config.baseDir);
  }

  // Project operations
  async bindProject(project: MotionProject): Promise<void> {
    const projectDir = this.getProjectDir(project.id);
    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(projectDir, 'tasks'));
    await fs.ensureDir(path.join(projectDir, 'docs'));

    const meta: ProjectMeta = {
      id: project.id,
      name: project.name,
      description: project.description,
      workspaceId: project.workspaceId,
      boundAt: new Date().toISOString(),
    };

    await fs.writeJson(path.join(projectDir, 'meta.json'), meta, { spaces: 2 });
  }

  async unbindProject(projectId: string): Promise<void> {
    const projectDir = this.getProjectDir(projectId);
    await fs.remove(projectDir);
  }

  async getProjectMeta(projectId: string): Promise<ProjectMeta | null> {
    const metaPath = path.join(this.getProjectDir(projectId), 'meta.json');
    if (await fs.pathExists(metaPath)) {
      return fs.readJson(metaPath);
    }
    return null;
  }

  async updateProjectMeta(projectId: string, updates: Partial<ProjectMeta>): Promise<void> {
    const meta = await this.getProjectMeta(projectId);
    if (!meta) {
      throw new Error(`Project ${projectId} not bound`);
    }
    
    const updated = { ...meta, ...updates };
    const metaPath = path.join(this.getProjectDir(projectId), 'meta.json');
    await fs.writeJson(metaPath, updated, { spaces: 2 });
  }

  async listBoundProjects(): Promise<ProjectMeta[]> {
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
    const taskPath = this.getTaskPath(projectId, task.id);
    const taskFile = this.taskToMarkdown(task);
    await fs.writeFile(taskPath, taskFile);
  }

  async getTask(projectId: string, taskId: string): Promise<TaskFile | null> {
    const taskPath = this.getTaskPath(projectId, taskId);
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
    const tasksDir = path.join(this.getProjectDir(projectId), 'tasks');
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
    const taskPath = this.getTaskPath(projectId, taskId);
    await fs.remove(taskPath);
  }

  async searchTasks(query: string): Promise<Array<{ projectId: string; task: TaskFile }>> {
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
    const docPath = path.join(this.getProjectDir(projectId), 'docs', filename);
    await fs.writeFile(docPath, content);
  }

  async getDocument(projectId: string, filename: string): Promise<string | null> {
    const docPath = path.join(this.getProjectDir(projectId), 'docs', filename);
    if (await fs.pathExists(docPath)) {
      return fs.readFile(docPath, 'utf-8');
    }
    return null;
  }

  async listDocuments(projectId: string): Promise<string[]> {
    const docsDir = path.join(this.getProjectDir(projectId), 'docs');
    if (!await fs.pathExists(docsDir)) {
      return [];
    }
    
    const files = await fs.readdir(docsDir);
    return files.filter(f => f.endsWith('.md'));
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
    content.push(`- **Status**: ${task.status}`);
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
}