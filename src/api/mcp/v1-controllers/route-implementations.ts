// Route Implementations
// Connects generated route interfaces with controller implementations

import { ProjectControllerRoutes } from '../v1-routes/routes/ProjectControllerRoutes';
import { TaskControllerRoutes } from '../v1-routes/routes/TaskControllerRoutes';
import { createMotionController } from './motion-controller';
import { Dependencies } from '../../../setup/dependencies';

/**
 * Create route implementations from dependencies
 */
export function createRouteImplementations(deps: Dependencies): {
  projectRoutes: ProjectControllerRoutes;
  taskRoutes: TaskControllerRoutes;
} {
  const motionController = deps.controllers.motionController;

  // Project routes implementation
  const projectRoutes: ProjectControllerRoutes = {
    listProjects: async (args) => {
      return motionController.listProjects(args);
    },
  };

  // Task routes implementation
  const taskRoutes: TaskControllerRoutes = {
    createTask: async (args) => {
      return motionController.createTask(args);
    },
  };

  return {
    projectRoutes,
    taskRoutes,
  };
}