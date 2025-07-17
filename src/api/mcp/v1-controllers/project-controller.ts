// Project Controller
// MCP tool handlers for Project domain operations

import { ProjectCommands } from '../../../app/projects/project-commands';
import { MotionQueries } from '../../../app/motion/motion-queries';
import { MotionCommands } from '../../../app/motion/motion-commands';
import { ProjectController } from '../v1-routes/routes/ProjectControllerRoutes';

export function createProjectController(deps: {
  readonly app: {
    readonly motionQueries: MotionQueries;
    readonly motionCommands: MotionCommands;
    readonly projectCommands: ProjectCommands;
  };
}): ProjectController {
  return {
    listProjects: async (req) => {
      try {
        const projects = await deps.app.motionQueries.listProjects(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: projects,
              count: projects.length,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    createProject: async (req) => {
      try {
        const project = await deps.app.motionCommands.createProject(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Project "${project.name}" created successfully`,
              data: project,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error creating project: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    bindProject: async (req) => {
      try {
        const result = await deps.app.projectCommands.bindProject(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Project ${result.projectId} bound to local storage`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error binding project: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    syncProject: async (req) => {
      try {
        const result = await deps.app.projectCommands.syncProject(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Synced ${result.syncedTasks} tasks for project ${result.projectId}`,
              data: result,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error syncing project: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}