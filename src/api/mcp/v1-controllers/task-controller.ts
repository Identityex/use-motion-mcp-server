// Task Controller
// MCP tool handlers for Task domain operations

import { TaskCommands } from '../../../app/tasks/task-commands.js';
import { TaskQueries } from '../../../app/tasks/task-queries.js';
import { wrapController } from '../../../services/utils/error-handler.js';
import { TaskController } from '../v1-routes/routes/TaskControllerRoutes.js';

export function createTaskController(deps: {
  readonly app: {
    readonly taskCommands: TaskCommands;
    readonly taskQueries: TaskQueries;
  };
}): TaskController {
  const controller: TaskController = {
    listTasks: async (req) => {
      try {
        console.log('CONTROLLER DEBUG: listTasks called with:', req);
        const tasks = await deps.app.taskQueries.listTasks(req);
        console.log('CONTROLLER DEBUG: Got tasks:', tasks.length);
        
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
        console.log('CONTROLLER DEBUG: Error in listTasks:', error);
        
        return {
          content: [{
            type: 'text',
            text: `CONTROLLER ERROR: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },

    createTask: async (req) => {
      const task = await deps.app.taskCommands.createTask(req);
      
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
    },

    updateTask: async (req) => {
      const task = await deps.app.taskCommands.updateTask(req);
      
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
    },

    batchCreateTasks: async (req) => {
      const result = await deps.app.taskCommands.batchCreateTasks(req);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Created ${result.tasks.length} tasks from goal`,
            data: result,
          }, null, 2),
        }],
      };
    },

    searchTasks: async (req) => {
      const tasks = await deps.app.taskQueries.searchTasks(req);
      
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
    },

    completeTask: async (req) => {
      const result = await deps.app.taskCommands.completeTask(req);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Task ${result.taskId} marked as completed`,
            data: result,
          }, null, 2),
        }],
      };
    },

    moveTask: async (req) => {
      const result = await deps.app.taskCommands.moveTask(req);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Task ${result.taskId} moved to project ${result.newProjectId}`,
            data: result,
          }, null, 2),
        }],
      };
    },

    enrichTask: async (req) => {
      const result = await deps.app.taskCommands.enrichTask(req);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Task enriched with AI-generated details',
            data: result,
          }, null, 2),
        }],
      };
    },

    analyzeTask: async (req) => {
      const analysis = await deps.app.taskCommands.analyzeTask(req);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: analysis,
          }, null, 2),
        }],
      };
    },
  };

  // Wrap all methods with error handling
  return wrapController(controller, 'TaskController');
}