// Workspace Command Functions

import { StorageService } from '../../services/storage/storage-service.js';
import { WorkspaceSettings } from './workspace-queries.js';
import path from 'path';
import fs from 'fs/promises';

interface WorkspaceCommandsDependencies {
  storageService: StorageService;
  baseDir: string;
}

export function createWorkspaceCommands(deps: WorkspaceCommandsDependencies) {
  const { storageService, baseDir } = deps;

  async function setDefaultWorkspace(params: {
    workspaceId: string;
  }): Promise<void> {
    const settingsDir = path.join(
      baseDir,
      'workspace-settings'
    );
    
    // Ensure directory exists
    await fs.mkdir(settingsDir, { recursive: true });
    
    const defaultPath = path.join(settingsDir, 'default.json');
    
    await fs.writeFile(
      defaultPath,
      JSON.stringify({ workspaceId: params.workspaceId }, null, 2)
    );
  }

  async function updateWorkspaceSettings(params: {
    workspaceId: string;
    settings?: Record<string, any>;
  }): Promise<void> {
    if (!params.settings || Object.keys(params.settings).length === 0) {
      return;
    }
    
    const settingsDir = path.join(
      baseDir,
      'workspace-settings'
    );
    
    // Ensure directory exists
    await fs.mkdir(settingsDir, { recursive: true });
    
    const settingsPath = path.join(settingsDir, `${params.workspaceId}.json`);
    
    // Load existing settings or create new ones
    let currentSettings: WorkspaceSettings;
    try {
      const existingContent = await fs.readFile(settingsPath, 'utf-8');
      currentSettings = JSON.parse(existingContent);
    } catch (error) {
      currentSettings = {
        workspaceId: params.workspaceId,
        defaultPriority: 'MEDIUM',
        defaultDuration: 60,
        aiProvider: 'mock',
      };
    }
    
    // Update settings
    const updatedSettings: WorkspaceSettings = {
      ...currentSettings,
      ...params.settings,
      workspaceId: params.workspaceId, // Ensure workspaceId is not overwritten
    };
    
    await fs.writeFile(
      settingsPath,
      JSON.stringify(updatedSettings, null, 2)
    );
  }

  return {
    setDefaultWorkspace,
    updateWorkspaceSettings,
  };
}