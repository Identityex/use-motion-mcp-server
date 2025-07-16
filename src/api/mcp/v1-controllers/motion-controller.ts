// Motion Controller
// MCP tool handlers for Motion domain operations

import { MotionCommands } from '../../../app/motion/motion-commands';
import { MotionQueries } from '../../../app/motion/motion-queries';

export interface MCPToolResponse {
  readonly content: Array<{
    readonly type: 'text';
    readonly text: string;
  }>;
  readonly isError?: boolean;
}

export interface MotionController {
  readonly listProjects: (req: any) => Promise<MCPToolResponse>;
  readonly createProject: (req: any) => Promise<MCPToolResponse>;
  readonly listTasks: (req: any) => Promise<MCPToolResponse>;
  readonly createTask: (req: any) => Promise<MCPToolResponse>;
  readonly updateTask: (req: any) => Promise<MCPToolResponse>;
}

export function createMotionController(deps: {
  readonly app: {
    readonly motionQueries: MotionQueries;
    readonly motionCommands: MotionCommands;
  };
}): MotionController {
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

    listTasks: async (req) => {
      try {
        const tasks = await deps.app.motionQueries.listTasks(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: tasks,
              count: tasks.length,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error listing tasks: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    createTask: async (req) => {
      try {
        const task = await deps.app.motionCommands.createTask(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task "${task.name}" created successfully`,
              data: task,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error creating task: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    updateTask: async (req) => {
      try {
        const task = await deps.app.motionCommands.updateTask(req);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task "${task.name}" updated successfully`,
              data: task,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error updating task: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  };
}