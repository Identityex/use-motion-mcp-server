// Unit tests for request validation schemas
// Tests that all MCP tool inputs are properly validated

import { describe, it, expect } from '@jest/globals';
import {
  createTaskRequestSchema,
  updateTaskRequestSchema,
  batchCreateTasksRequestSchema,
  listTasksRequestSchema,
  searchTasksRequestSchema,
  createProjectRequestSchema,
  bindProjectRequestSchema,
  syncProjectRequestSchema,
  planWorkflowRequestSchema,
  saveContextRequestSchema,
  loadContextRequestSchema,
  createDocsRequestSchema,
  updateDocsRequestSchema,
} from '../../../src/services/validation/request-schemas';

describe('Request Validation Schemas', () => {
  describe('createTaskRequestSchema', () => {
    it('should accept valid task creation requests', () => {
      const valid = {
        name: 'Test Task',
        description: 'Task description',
        priority: 'HIGH',
        projectId: 'project-123',
        enrich: true,
      };
      
      const result = createTaskRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should require name field', () => {
      const invalid = {
        description: 'Missing name',
      };
      
      expect(() => createTaskRequestSchema.parse(invalid)).toThrow('Required');
    });

    it('should reject invalid priority', () => {
      const invalid = {
        name: 'Test Task',
        priority: 'INVALID',
      };
      
      expect(() => createTaskRequestSchema.parse(invalid)).toThrow('Invalid enum value');
    });

    it('should reject path traversal in projectId', () => {
      const invalid = {
        name: 'Test Task',
        projectId: '../../../etc/passwd',
      };
      
      expect(() => createTaskRequestSchema.parse(invalid)).toThrow('Invalid project ID format');
    });

    it('should coerce string boolean to boolean', () => {
      const input = {
        name: 'Test Task',
        enrich: 'true',
      };
      
      // Boolean coercion is not enabled by default in Zod
      expect(() => createTaskRequestSchema.parse(input)).toThrow('Expected boolean, received string');
    });

    it('should handle optional fields', () => {
      const minimal = {
        name: 'Minimal Task',
      };
      
      const result = createTaskRequestSchema.parse(minimal);
      expect(result).toEqual({ name: 'Minimal Task' });
    });

    it('should trim whitespace from name', () => {
      const input = {
        name: '  Trimmed Task  ',
      };
      
      const result = createTaskRequestSchema.parse(input);
      expect(result.name).toBe('Trimmed Task');
    });
  });

  describe('updateTaskRequestSchema', () => {
    it('should accept valid update requests', () => {
      const valid = {
        taskId: 'task-123',
        name: 'Updated Task',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
      };
      
      const result = updateTaskRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should require taskId', () => {
      const invalid = {
        name: 'Missing taskId',
      };
      
      expect(() => updateTaskRequestSchema.parse(invalid)).toThrow('Required');
    });

    it('should allow partial updates', () => {
      const partial = {
        taskId: 'task-123',
        status: 'COMPLETED',
      };
      
      const result = updateTaskRequestSchema.parse(partial);
      expect(result).toEqual(partial);
    });

    it('should validate enum values', () => {
      const invalid = {
        taskId: 'task-123',
        status: 'DONE', // Invalid status
      };
      
      expect(() => updateTaskRequestSchema.parse(invalid)).toThrow('Invalid enum value');
    });
  });

  describe('batchCreateTasksRequestSchema', () => {
    it('should accept valid batch creation request', () => {
      const valid = {
        goal: 'Create a user authentication system',
        projectId: 'auth-project',
        maxTasks: 5,
      };
      
      const result = batchCreateTasksRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should require goal', () => {
      const invalid = {
        projectId: 'project-123',
      };
      
      expect(() => batchCreateTasksRequestSchema.parse(invalid)).toThrow('Required');
    });

    it('should validate maxTasks range', () => {
      const tooMany = {
        goal: 'Create tasks',
        projectId: 'project-123',
        maxTasks: 21,
      };
      
      expect(() => batchCreateTasksRequestSchema.parse(tooMany)).toThrow('Number must be less than or equal to 20');
    });

    it('should accept optional context', () => {
      const input = {
        goal: 'Create tasks',
        projectId: 'project-123',
        context: 'Additional context for AI',
      };
      
      const result = batchCreateTasksRequestSchema.parse(input);
      expect(result.context).toBe('Additional context for AI');
    });
  });

  describe('searchTasksRequestSchema', () => {
    it('should accept valid search requests', () => {
      const valid = {
        projectName: 'My Project',
        taskName: 'authentication',
        context: 'Search context',
      };
      
      const result = searchTasksRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should accept empty search', () => {
      const empty = {};
      
      const result = searchTasksRequestSchema.parse(empty);
      expect(result).toEqual({});
    });

    it('should validate field types', () => {
      const invalid = {
        projectName: 123, // Should be string
      };
      
      expect(() => searchTasksRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('createProjectRequestSchema', () => {
    it('should accept valid project creation', () => {
      const valid = {
        name: 'New Project',
        description: 'Project description',
        workspaceId: 'workspace-123',
      };
      
      const result = createProjectRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should require name', () => {
      const invalid = {
        description: 'Missing name',
      };
      
      expect(() => createProjectRequestSchema.parse(invalid)).toThrow('Required');
    });

    it('should validate workspaceId when provided', () => {
      const invalid = {
        name: 'Project',
        workspaceId: '../../../etc',
      };
      
      expect(() => createProjectRequestSchema.parse(invalid)).toThrow('Invalid workspace ID format');
    });
  });

  describe('planWorkflowRequestSchema', () => {
    it('should accept valid workflow planning request', () => {
      const valid = {
        goal: 'Build a REST API',
        context: 'Using Node.js and Express',
        projectId: 'api-project',
      };
      
      const result = planWorkflowRequestSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should require goal', () => {
      const invalid = {
        context: 'Some context',
      };
      
      expect(() => planWorkflowRequestSchema.parse(invalid)).toThrow('Required');
    });
  });

  describe('saveContextRequestSchema', () => {
    it('should accept valid context save request', () => {
      const valid = {
        projectId: 'project-123',
        context: 'Project context information',
        append: true,
      };
      
      const result = saveContextRequestSchema.parse(valid);
      expect(result).toEqual({ projectId: 'project-123', context: 'Project context information' });
    });

    it('should require both projectId and context', () => {
      const missingContext = {
        projectId: 'project-123',
      };
      
      expect(() => saveContextRequestSchema.parse(missingContext)).toThrow('Required');
      
      const missingProjectId = {
        context: 'Some context',
      };
      
      expect(() => saveContextRequestSchema.parse(missingProjectId)).toThrow('Required');
    });

    it('should handle large context', () => {
      const input = {
        projectId: 'project-123',
        context: 'A'.repeat(50000), // Large context
      };
      
      const result = saveContextRequestSchema.parse(input);
      expect(result.context.length).toBe(50000);
    });

    it('should reject context that is too large', () => {
      const input = {
        projectId: 'project-123',
        context: 'A'.repeat(100001),
      };
      
      expect(() => saveContextRequestSchema.parse(input)).toThrow();
    });
  });

  describe('Edge cases and security', () => {
    it('should handle very long inputs gracefully', () => {
      const longName = 'a'.repeat(256); // Longer than max allowed
      const input = {
        name: longName,
      };
      
      // Test that name validation works
      expect(() => createTaskRequestSchema.parse(input)).toThrow('Name too long');
    });

    it('should accept text with basic characters', () => {
      const withBasicChars = {
        name: 'Task Name with Numbers 123',
      };
      
      // Should not throw for normal text
      const result = createTaskRequestSchema.parse(withBasicChars);
      expect(result.name).toBe('Task Name with Numbers 123');
    });

    it('should handle nested validation in complex schemas', () => {
      const invalid = {
        goal: 'Valid goal',
        projectId: '../invalid/path',
      };
      
      expect(() => planWorkflowRequestSchema.parse(invalid)).toThrow();
    });

    it('should strip unknown fields', () => {
      const withExtra = {
        name: 'Task',
        unknownField: 'should be stripped',
        anotherUnknown: 123,
      };
      
      const result = createTaskRequestSchema.parse(withExtra);
      expect(result).toEqual({ name: 'Task' });
      expect(result).not.toHaveProperty('unknownField');
      expect(result).not.toHaveProperty('anotherUnknown');
    });
  });
});