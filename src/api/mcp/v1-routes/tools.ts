// Generated MCP Tools Configuration
// This file is auto-generated. Do not edit manually.

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All MCP tools defined in the OpenAPI schemas
 */
export const MCPTools: Tool[] = [
  {
    name: 'motion.project.list',
    description: 'List all projects with pagination',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        workspaceId: {
          type: 'string',
          description: ''
        },
        limit: {
          type: 'integer',
          description: '',
          minimum: 1,
          maximum: 100,
          default: 50
        },
        cursor: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.project.create',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        name: {
          type: 'string',
          description: ''
        },
        description: {
          type: 'string',
          description: ''
        },
        workspaceId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.project.bind',
    description: 'Bind project to local storage',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.project.sync',
    description: 'Sync project with Motion',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        force: {
          type: 'boolean',
          description: '',
          default: false
        }
      }
    }
  },
  {
    name: 'motion.task.create',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        name: {
          type: 'string',
          description: ''
        },
        description: {
          type: 'string',
          description: ''
        },
        priority: {
          type: 'string',
          description: '',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        enrich: {
          type: 'boolean',
          description: '',
          default: false
        },
        projectId: {
          type: 'string',
          description: ''
        },
        duration: {
          type: 'integer',
          description: '',
          minimum: 0
        },
        dueDate: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.batch_create',
    description: 'Create multiple tasks from goals',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        goal: {
          type: 'string',
          description: ''
        },
        projectId: {
          type: 'string',
          description: ''
        },
        maxTasks: {
          type: 'integer',
          description: '',
          minimum: 1,
          maximum: 20,
          default: 5
        },
        context: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.list',
    description: 'List and filter tasks',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        status: {
          type: 'string',
          description: '',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        },
        priority: {
          type: 'string',
          description: '',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        limit: {
          type: 'integer',
          description: '',
          minimum: 1,
          maximum: 100,
          default: 50
        },
        cursor: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.search',
    description: 'Search tasks in local storage',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        query: {
          type: 'string',
          description: ''
        },
        projectId: {
          type: 'string',
          description: ''
        },
        status: {
          type: 'string',
          description: '',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        }
      }
    }
  },
  {
    name: 'motion.task.update',
    description: 'Update task properties',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        taskId: {
          type: 'string',
          description: ''
        },
        name: {
          type: 'string',
          description: ''
        },
        description: {
          type: 'string',
          description: ''
        },
        status: {
          type: 'string',
          description: '',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        },
        priority: {
          type: 'string',
          description: '',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        duration: {
          type: 'integer',
          description: '',
          minimum: 0
        },
        dueDate: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.complete',
    description: 'Mark tasks as completed',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        taskId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.move',
    description: 'Move task to different project',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        taskId: {
          type: 'string',
          description: ''
        },
        targetProjectId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.enrich',
    description: 'AI-enhance task descriptions',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        taskId: {
          type: 'string',
          description: ''
        },
        context: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.task.analyze',
    description: 'Analyze task complexity',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        taskId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.workflow.plan',
    description: 'Generate comprehensive plans',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        goal: {
          type: 'string',
          description: ''
        },
        projectId: {
          type: 'string',
          description: ''
        },
        context: {
          type: 'string',
          description: ''
        },
        constraints: {
          type: 'object',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.sync.all',
    description: 'Sync all bound projects',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        force: {
          type: 'boolean',
          description: '',
          default: false
        }
      }
    }
  },
  {
    name: 'motion.sync.check',
    description: 'Check sync status',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.context.save',
    description: 'Save project context for AI',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        context: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.context.load',
    description: 'Load project context',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.docs.create',
    description: 'Generate project documentation',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        type: {
          type: 'string',
          description: '',
          enum: ['readme', 'architecture', 'api', 'user-guide']
        },
        template: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.docs.update',
    description: 'Update existing docs',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        docId: {
          type: 'string',
          description: ''
        },
        content: {
          type: 'string',
          description: ''
        }
      }
    }
  },
  {
    name: 'motion.status.report',
    description: 'Generate status reports',
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        projectId: {
          type: 'string',
          description: ''
        },
        format: {
          type: 'string',
          description: '',
          enum: ['markdown', 'json', 'summary'],
          default: 'markdown'
        },
        includeMetrics: {
          type: 'boolean',
          description: '',
          default: true
        }
      }
    }
  },
];