// Dependencies Setup
// Dependency injection configuration following work-stable-api pattern

import {
    createContextController,
    createDocsController,
    createProjectController,
    createSyncController,
    createTaskController,
    createWorkflowController,
    createWorkspaceController,
} from '../api/mcp/v1-controllers/index.js';
import { createContextCommands } from '../app/context/context-commands.js';
import { createDocsCommands } from '../app/docs/docs-commands.js';
import { createMotionCommands } from '../app/motion/motion-commands.js';
import { createMotionQueries } from '../app/motion/motion-queries.js';
import { createProjectCommands } from '../app/projects/project-commands.js';
import { createSyncCommands } from '../app/sync/sync-commands.js';
import { createTaskCommands } from '../app/tasks/task-commands.js';
import { createTaskQueries } from '../app/tasks/task-queries.js';
import { createWorkflowCommands } from '../app/workflow/workflow-commands.js';
import { createWorkspaceCommands } from '../app/workspace/workspace-commands.js';
import { createWorkspaceQueries } from '../app/workspace/workspace-queries.js';
import { createAIService } from '../services/ai/ai-service.js';
import { AIProviderType } from '../services/ai/providers/provider-factory.js';
import { createMotionService, MotionService } from '../services/motion-service.js';
import { createStorageService } from '../services/storage/storage-service.js';

// Configuration interface
export interface Config {
  readonly motion: {
    readonly apiKey: string;
    readonly baseUrl?: string;
    readonly workspaceId?: string;
  };
  readonly ai?: {
    readonly apiKey?: string;
    readonly model?: string;
  };
}

// Dependencies interface
export interface Dependencies {
  readonly controllers: {
    readonly projectController: ReturnType<typeof createProjectController>;
    readonly taskController: ReturnType<typeof createTaskController>;
    readonly workflowController: ReturnType<typeof createWorkflowController>;
    readonly syncController: ReturnType<typeof createSyncController>;
    readonly contextController: ReturnType<typeof createContextController>;
    readonly docsController: ReturnType<typeof createDocsController>;
    readonly workspaceController: ReturnType<typeof createWorkspaceController>;
  };
  readonly app: {
    readonly motionCommands: ReturnType<typeof createMotionCommands>;
    readonly motionQueries: ReturnType<typeof createMotionQueries>;
    readonly projectCommands: ReturnType<typeof createProjectCommands>;
    readonly taskCommands: ReturnType<typeof createTaskCommands>;
    readonly taskQueries: ReturnType<typeof createTaskQueries>;
    readonly workflowCommands: ReturnType<typeof createWorkflowCommands>;
    readonly syncCommands: ReturnType<typeof createSyncCommands>;
    readonly contextCommands: ReturnType<typeof createContextCommands>;
    readonly docsCommands: ReturnType<typeof createDocsCommands>;
    readonly workspaceCommands: ReturnType<typeof createWorkspaceCommands>;
    readonly workspaceQueries: ReturnType<typeof createWorkspaceQueries>;
  };
  readonly services: {
    readonly motionService: MotionService;
    readonly storageService: ReturnType<typeof createStorageService>;
    readonly aiService: ReturnType<typeof createAIService>;
  };
}

// Create all dependencies with proper wiring
export async function createDependencies(config: Config): Promise<Dependencies> {
  // Create services
  const motionService = await createMotionService({
    apiKey: config.motion.apiKey,
    baseUrl: config.motion.baseUrl,
    workspaceId: config.motion.workspaceId,
  });
  
  const storageService = createStorageService({
    baseDir: '.claude/motion',
  });
  
  const aiService = createAIService({ 
    config: {
      provider: (process.env.AI_PROVIDER as AIProviderType) || 'mock',
      apiKey: config.ai?.apiKey,
      model: config.ai?.model,
      baseUrl: process.env.AI_BASE_URL,
      enableEnrichment: config.ai?.apiKey ? true : false,
    }
  });
  
  const services = { motionService, storageService, aiService };

  // Create app layer
  const motionCommands = createMotionCommands({ services });
  const motionQueries = createMotionQueries({ services });
  const projectCommands = createProjectCommands({ services });
  const taskCommands = createTaskCommands({ services });
  const taskQueries = createTaskQueries({ services });
  const workflowCommands = createWorkflowCommands({ services });
  const syncCommands = createSyncCommands({ services });
  const contextCommands = createContextCommands({ services });
  const docsCommands = createDocsCommands({ services });
  const workspaceCommands = createWorkspaceCommands({ storageService, baseDir: '.claude/motion' });
  const workspaceQueries = createWorkspaceQueries({ motionService, storageService, baseDir: '.claude/motion' });
  
  const app = { 
    motionCommands, 
    motionQueries,
    projectCommands,
    taskCommands,
    taskQueries,
    workflowCommands,
    syncCommands,
    contextCommands,
    docsCommands,
    workspaceCommands,
    workspaceQueries
  };

  // Create controllers
  const projectController = createProjectController({ app });
  const taskController = createTaskController({ app });
  const workflowController = createWorkflowController({ app });
  const syncController = createSyncController({ app });
  const contextController = createContextController({ app });
  const docsController = createDocsController({ app });
  
  const workspaceController = createWorkspaceController({
    listWorkspacesCommand: workspaceQueries.listWorkspaces,
    setDefaultWorkspaceCommand: workspaceCommands.setDefaultWorkspace,
    getWorkspaceSettingsQuery: workspaceQueries.getWorkspaceSettings,
    updateWorkspaceSettingsCommand: workspaceCommands.updateWorkspaceSettings,
  });
  
  const controllers = { 
    projectController,
    taskController,
    workflowController,
    syncController,
    contextController,
    docsController,
    workspaceController,
  };

  return {
    controllers,
    app,
    services,
  };
}