// Workspace Query Functions

import { MotionService } from '../../services/motion-service.js';
import { StorageService } from '../../services/storage/storage-service.js';
import path from 'path';
import fs from 'fs/promises';

export interface WorkspaceSettings {
  workspaceId: string;
  defaultProjectId?: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultDuration?: number;
  aiProvider?: 'openai' | 'anthropic' | 'mock';
}

interface WorkspaceQueriesDependencies {
  motionService: MotionService;
  storageService: StorageService;
  baseDir: string;
}

export function createWorkspaceQueries(deps: WorkspaceQueriesDependencies) {
  const { motionService, storageService, baseDir } = deps;

  async function listWorkspaces(params: {
    limit?: number;
    cursor?: string;
  }) {
    const workspaces = await motionService.listWorkspaces();
    
    // Apply pagination
    const limit = params.limit || 50;
    const startIndex = params.cursor ? parseInt(params.cursor, 10) : 0;
    const endIndex = startIndex + limit;
    
    const paginatedWorkspaces = workspaces.slice(startIndex, endIndex);
    const nextCursor = endIndex < workspaces.length ? endIndex.toString() : undefined;
    
    return {
      data: paginatedWorkspaces,
      meta: {
        pageSize: paginatedWorkspaces.length,
        cursor: nextCursor,
      },
    };
  }

  async function getWorkspaceSettings(params: {
    workspaceId?: string;
  }): Promise<WorkspaceSettings | null> {
    // If no workspaceId provided, get the default workspace
    let workspaceId = params.workspaceId;
    
    if (!workspaceId) {
      const defaultSettings = await getDefaultWorkspaceId();
      if (!defaultSettings) {
        return null;
      }
      workspaceId = defaultSettings;
    }
    
    try {
      const settingsPath = path.join(
        baseDir,
        'workspace-settings',
        `${workspaceId}.json`
      );
      
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      return JSON.parse(settingsContent);
    } catch (error) {
      // Return default settings if file doesn't exist
      return {
        workspaceId,
        defaultPriority: 'MEDIUM',
        defaultDuration: 60,
        aiProvider: 'mock',
      };
    }
  }

  async function getDefaultWorkspaceId(): Promise<string | null> {
    try {
      const defaultPath = path.join(
        baseDir,
        'workspace-settings',
        'default.json'
      );
      
      const defaultContent = await fs.readFile(defaultPath, 'utf-8');
      const defaultSettings = JSON.parse(defaultContent);
      return defaultSettings.workspaceId;
    } catch (error) {
      return null;
    }
  }

  return {
    listWorkspaces,
    getWorkspaceSettings,
    getDefaultWorkspaceId,
  };
}