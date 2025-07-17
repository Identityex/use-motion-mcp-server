// Unit tests for security validators
// Tests path traversal protection, input sanitization, and validation

import { describe, it, expect } from '@jest/globals';
import {
  validateProjectId,
  validateTaskId,
  validateUserId,
  validateWorkspaceId,
  validateFileName,
  sanitizeForLog,
  validators,
  createValidationError,
} from '../../../src/services/validation/validators';

describe('Security Validators', () => {
  describe('validateProjectId', () => {
    it('should accept valid project IDs', () => {
      expect(validateProjectId('project-123')).toBe('project-123');
      expect(validateProjectId('my_project')).toBe('my_project');
      expect(validateProjectId('123')).toBe('123');
      expect(validateProjectId('a-b-c')).toBe('a-b-c');
    });

    it('should reject path traversal attempts', () => {
      expect(() => validateProjectId('../etc/passwd')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('../../secret')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('project/../../../etc')).toThrow('Project ID contains invalid characters');
      expect(() => validateProjectId('project\\..\\..\\etc')).toThrow('Project ID contains invalid characters');
    });

    it('should reject IDs with directory separators', () => {
      expect(() => validateProjectId('projects/123')).toThrow('Project ID contains invalid characters');
      expect(() => validateProjectId('projects\\123')).toThrow('Project ID contains invalid characters');
      expect(() => validateProjectId('a/b/c')).toThrow('Project ID contains invalid characters');
    });

    it('should reject empty or too long IDs', () => {
      expect(() => validateProjectId('')).toThrow('Project ID is required');
      expect(() => validateProjectId('a'.repeat(65))).toThrow('Project ID too long');
    });

    it('should reject IDs with special characters', () => {
      expect(() => validateProjectId('project$123')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('project@123')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('project#123')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('project!123')).toThrow('Invalid project ID format');
    });

    it('should handle malicious Unicode characters', () => {
      expect(() => validateProjectId('project\u0000')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('project\u202e')).toThrow('Invalid project ID format');
      expect(() => validateProjectId('pro‥ject')).toThrow('Invalid project ID format'); // Unicode two-dot leader
    });
  });

  describe('validateTaskId', () => {
    it('should accept valid task IDs', () => {
      expect(validateTaskId('task-456')).toBe('task-456');
      expect(validateTaskId('t123')).toBe('t123');
      expect(validateTaskId('my_task_id')).toBe('my_task_id');
    });

    it('should reject path traversal in task IDs', () => {
      expect(() => validateTaskId('../task')).toThrow('Invalid task ID format');
      expect(() => validateTaskId('task/..')).toThrow('Invalid task ID format');
      expect(() => validateTaskId('..\\windows\\system32')).toThrow('Invalid task ID format');
    });

    it('should enforce length limits', () => {
      expect(() => validateTaskId('')).toThrow('Task ID is required');
      expect(() => validateTaskId('t'.repeat(65))).toThrow('Task ID too long');
    });
  });

  describe('validateFileName', () => {
    it('should accept valid file names', () => {
      expect(validateFileName('document.md')).toBe('document.md');
      expect(validateFileName('project-2024.txt')).toBe('project-2024.txt');
      expect(validateFileName('feature_auth.doc')).toBe('feature_auth.doc');
      expect(validateFileName('task123.json')).toBe('task123.json');
    });

    it('should reject empty file names', () => {
      expect(() => validateFileName('')).toThrow('File name is required');
    });

    it('should reject file names that are too long', () => {
      expect(() => validateFileName('a'.repeat(256))).toThrow('File name too long');
    });

    it('should reject file names with path traversal', () => {
      expect(() => validateFileName('../etc/passwd')).toThrow('Invalid file name format');
      expect(() => validateFileName('../../secret')).toThrow('Invalid file name format');
      expect(() => validateFileName('file/../../../etc')).toThrow('File name contains invalid characters');
      expect(() => validateFileName('file\\..\\..\\etc')).toThrow('File name contains invalid characters');
    });

    it('should reject file names with directory separators', () => {
      expect(() => validateFileName('path/to/file')).toThrow('Invalid file name format');
      expect(() => validateFileName('path\\to\\file')).toThrow('Invalid file name format');
    });
  });

  describe('validateUserId', () => {
    it('should accept valid user IDs', () => {
      expect(validateUserId('user-123')).toBe('user-123');
      expect(validateUserId('u456')).toBe('u456');
      expect(validateUserId('admin_user')).toBe('admin_user');
    });

    it('should reject invalid user IDs', () => {
      expect(() => validateUserId('')).toThrow('User ID is required');
      expect(() => validateUserId('user/123')).toThrow('Invalid user ID format');
      expect(() => validateUserId('../user')).toThrow('Invalid user ID format');
    });
  });

  describe('validateWorkspaceId', () => {
    it('should accept valid workspace IDs', () => {
      expect(validateWorkspaceId('ws-123')).toBe('ws-123');
      expect(validateWorkspaceId('workspace_456')).toBe('workspace_456');
    });

    it('should reject invalid workspace IDs', () => {
      expect(() => validateWorkspaceId('')).toThrow('Workspace ID is required');
      expect(() => validateWorkspaceId('ws/123')).toThrow('Invalid workspace ID format');
    });
  });

  describe('createValidationError', () => {
    it('should create error without exposing value', () => {
      const error = createValidationError('password', 'secret123');
      expect(error.message).toBe('Invalid password format');
      expect(error.message).not.toContain('secret123');
    });

    it('should work with any field name', () => {
      expect(createValidationError('email', 'test@example.com').message).toBe('Invalid email format');
      expect(createValidationError('apiKey', 'sk-12345').message).toBe('Invalid apiKey format');
    });
  });

  describe('sanitizeForLog', () => {
    it('should remove sensitive patterns', () => {
      expect(sanitizeForLog('API key: sk-1234567890')).toBe('API key: [REDACTED]');
      expect(sanitizeForLog('Token: eyJhbGciOiJIUzI1NiIs')).toBe('Token: [REDACTED]');
      expect(sanitizeForLog('Password: secret123')).toBe('Password: [REDACTED]');
    });

    it('should handle multiple sensitive values', () => {
      const input = 'API key: sk-1234567890 and token: eyJhbGciOiJIUzI1NiIs.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(sanitizeForLog(input)).toBe('API key: [REDACTED] and token: [REDACTED]');
    });

    it('should preserve non-sensitive content', () => {
      expect(sanitizeForLog('Normal log message')).toBe('Normal log message');
      expect(sanitizeForLog('Task ID: 12345')).toBe('Task ID: 12345');
    });

    it('should handle edge cases', () => {
      expect(sanitizeForLog('')).toBe('');
      expect(sanitizeForLog('sk-')).toBe('sk-');
      expect(sanitizeForLog('Bearer')).toBe('Bearer');
    });

    it('should handle various API key formats', () => {
      expect(sanitizeForLog('key=AIzaSyC123456')).toBe('key=[REDACTED]');
      expect(sanitizeForLog('secret: glsa_16A123')).toBe('secret: [REDACTED]');
      expect(sanitizeForLog('token: ghp_123abc')).toBe('token: [REDACTED]');
    });
  });

  describe('Zod validators', () => {
    describe('projectId validator', () => {
      it('should validate correctly', () => {
        expect(validators.projectId.parse('valid-id')).toBe('valid-id');
        expect(() => validators.projectId.parse('')).toThrow();
        expect(() => validators.projectId.parse('../bad')).toThrow();
      });
    });

    describe('name validator', () => {
      it('should validate with trimming', () => {
        expect(validators.name.parse('  Task Name  ')).toBe('Task Name');
        expect(validators.name.parse('Valid Name')).toBe('Valid Name');
      });

      it('should enforce length limits', () => {
        expect(() => validators.name.parse('')).toThrow('Name is required');
        expect(() => validators.name.parse('a'.repeat(256))).toThrow('Name too long');
      });
    });

    describe('status validator', () => {
      it('should validate enum values', () => {
        expect(validators.status.parse('TODO')).toBe('TODO');
        expect(validators.status.parse('IN_PROGRESS')).toBe('IN_PROGRESS');
        expect(() => validators.status.parse('INVALID')).toThrow();
      });
    });

    describe('priority validator', () => {
      it('should validate enum values', () => {
        expect(validators.priority.parse('HIGH')).toBe('HIGH');
        expect(validators.priority.parse('LOW')).toBe('LOW');
        expect(() => validators.priority.parse('CRITICAL')).toThrow();
      });
    });

    describe('date validator', () => {
      it('should validate ISO date strings', () => {
        const dateStr = '2024-01-01T00:00:00Z';
        expect(validators.date.parse(dateStr)).toBe(dateStr);
      });

      it('should reject invalid date formats', () => {
        expect(() => validators.date.parse('2024-01-01')).toThrow();
        expect(() => validators.date.parse('invalid')).toThrow();
      });
    });
  });
});