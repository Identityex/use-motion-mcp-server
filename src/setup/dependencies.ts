// Dependencies Setup
// Dependency injection configuration following work-stable-api pattern

import {
    createContextController,
    createDocsController,
    createProjectController,
    createSyncController,
    createTaskController,
    createWorkflowController,
} from '../api/mcp/v1-controllers';
import { createContextCommands } from '../app/context/context-commands';
import { createDocsCommands } from '../app/docs/docs-commands';
import { createMotionCommands } from '../app/motion/motion-commands';
import { createMotionQueries } from '../app/motion/motion-queries';
import { createProjectCommands } from '../app/projects/project-commands';
import { createSyncCommands } from '../app/sync/sync-commands';
import { createTaskCommands } from '../app/tasks/task-commands';
import { createTaskQueries } from '../app/tasks/task-queries';
import { createWorkflowCommands } from '../app/workflow/workflow-commands';
import { createAIService } from '../services/ai/ai-service';
import { AIProviderType } from '../services/ai/providers/provider-factory';
import { createMotionService, MotionService } from '../services/motion-service';
import { createStorageService } from '../services/storage/storage-service';

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
  
  const app = { 
    motionCommands, 
    motionQueries,
    projectCommands,
    taskCommands,
    taskQueries,
    workflowCommands,
    syncCommands,
    contextCommands,
    docsCommands
  };

  // Create controllers
  const projectController = createProjectController({ app });
  const taskController = createTaskController({ app });
  const workflowController = createWorkflowController({ app });
  const syncController = createSyncController({ app });
  const contextController = createContextController({ app });
  const docsController = createDocsController({ app });
  
  const controllers = { 
    projectController,
    taskController,
    workflowController,
    syncController,
    contextController,
    docsController,
  };

  return {
    controllers,
    app,
    services,
  };
}