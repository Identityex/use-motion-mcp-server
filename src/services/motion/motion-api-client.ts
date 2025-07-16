// Motion API Client Interface
// Abstraction for Motion API client implementation

import { MotionClient } from './client';
import { MotionAPIClient } from '../service-types';

export function createMotionAPIClient(config: {
  apiKey: string;
  baseUrl?: string;
}): MotionAPIClient {
  const client = new MotionClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  return {
    get: async (url, options) => {
      // Use the public methods provided by MotionClient
      if (url === '/projects') {
        const response = await client.listProjects(options?.params);
        return { data: response };
      } else if (url === '/tasks') {
        const response = await client.listTasks(options?.params);
        return { data: response };
      } else if (url.startsWith('/projects/')) {
        const id = url.replace('/projects/', '');
        const response = await client.getProject(id);
        return { data: response };
      } else if (url.startsWith('/tasks/')) {
        const id = url.replace('/tasks/', '');
        const response = await client.getTask(id);
        return { data: response };
      }
      throw new Error(`Unsupported endpoint: ${url}`);
    },
    
    post: async (url, data) => {
      if (url === '/projects') {
        const response = await client.createProject(data);
        return { data: response };
      } else if (url === '/tasks') {
        const response = await client.createTask(data);
        return { data: response };
      }
      throw new Error(`Unsupported endpoint: ${url}`);
    },
    
    patch: async (url, data) => {
      if (url.startsWith('/tasks/')) {
        const id = url.replace('/tasks/', '');
        const response = await client.updateTask(id, data);
        return { data: response };
      }
      throw new Error(`Unsupported endpoint: ${url}`);
    },
    
    delete: async (url) => {
      if (url.startsWith('/tasks/')) {
        const id = url.replace('/tasks/', '');
        await client.deleteTask(id);
        return { data: {} };
      }
      throw new Error(`Unsupported endpoint: ${url}`);
    },
  };
}