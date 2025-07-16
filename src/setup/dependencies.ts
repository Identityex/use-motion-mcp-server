// Dependencies Setup
// Dependency injection configuration following work-stable-api pattern

import { MotionClient } from '../services/motion/client';
import { createMotionService } from '../services/motion/motion-service';
import { createAIService } from '../services/ai/ai-service';
import { createMotionCommands } from '../app/motion/motion-commands';
import { createMotionQueries } from '../app/motion/motion-queries';
import { createMotionController } from '../api/mcp/v1-controllers/motion-controller';

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
    readonly motionController: ReturnType<typeof createMotionController>;
  };
  readonly app: {
    readonly motionCommands: ReturnType<typeof createMotionCommands>;
    readonly motionQueries: ReturnType<typeof createMotionQueries>;
  };
  readonly services: {
    readonly motionService: ReturnType<typeof createMotionService>;
    readonly aiService: ReturnType<typeof createAIService>;
  };
}

// Create all dependencies with proper wiring
export function createDependencies(config: Config): Dependencies {
  // Create service clients
  const motionClient = new MotionClient({
    apiKey: config.motion.apiKey,
    baseUrl: config.motion.baseUrl,
  });

  // Create services
  const motionService = createMotionService({ client: motionClient });
  const aiService = createAIService({ 
    config: {
      enableEnrichment: config.ai?.apiKey ? true : false,
    }
  });
  const services = { motionService, aiService };

  // Create app layer
  const motionCommands = createMotionCommands({ services });
  const motionQueries = createMotionQueries({ services });
  const app = { motionCommands, motionQueries };

  // Create controllers
  const motionController = createMotionController({ app });
  const controllers = { motionController };

  return {
    controllers,
    app,
    services,
  };
}