// Input validation utilities
// Provides secure validation for user inputs to prevent injection attacks

import { z } from 'zod';

// UUID v4 validation pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Safe identifier pattern (alphanumeric, hyphens, underscores)
const SAFE_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,63}$/;

// Validators
export const validators = {
  // Validate Motion ID format (could be UUID or custom format)
  projectId: z.string()
    .min(1, 'Project ID is required')
    .max(64, 'Project ID too long')
    .regex(SAFE_ID_REGEX, 'Invalid project ID format')
    .refine(
      (id) => !id.includes('..') && !id.includes('/') && !id.includes('\\'),
      'Project ID contains invalid characters'
    ),
    
  taskId: z.string()
    .min(1, 'Task ID is required')
    .max(64, 'Task ID too long')
    .regex(SAFE_ID_REGEX, 'Invalid task ID format'),
    
  userId: z.string()
    .min(1, 'User ID is required')
    .max(64, 'User ID too long')
    .regex(SAFE_ID_REGEX, 'Invalid user ID format'),
    
  workspaceId: z.string()
    .min(1, 'Workspace ID is required')
    .max(64, 'Workspace ID too long')
    .regex(SAFE_ID_REGEX, 'Invalid workspace ID format'),
    
  // File name validation (for document names)
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]{0,254}$/, 'Invalid file name format')
    .refine(
      (name) => !name.includes('..') && !name.includes('/') && !name.includes('\\'),
      'File name contains invalid characters'
    ),
    
  // Task/Project names
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .transform(name => name.trim()),
    
  // Descriptions
  description: z.string()
    .max(10000, 'Description too long')
    .optional()
    .transform(desc => desc?.trim()),
    
  // Status validation
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  
  // Priority validation
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  
  // Date validation
  date: z.string()
    .datetime()
    .optional(),
    
  // Pagination
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
    
  cursor: z.string()
    .max(255)
    .optional(),
};

// Validation functions
export function validateProjectId(projectId: string): string {
  return validators.projectId.parse(projectId);
}

export function validateTaskId(taskId: string): string {
  return validators.taskId.parse(taskId);
}

export function validateUserId(userId: string): string {
  return validators.userId.parse(userId);
}

export function validateWorkspaceId(workspaceId: string): string {
  return validators.workspaceId.parse(workspaceId);
}

export function validateFileName(fileName: string): string {
  return validators.fileName.parse(fileName);
}

// Sanitization functions
export function sanitizeForLog(value: string): string {
  // Common API key patterns
  const apiKeyPatterns = [
    // Prefixed keys
    /\b(sk|pk|api|key|secret|token|auth|bearer|ghp|gho|ghs|glsa|AIza)[-_]?[A-Za-z0-9+/]{10,}/gi,
    // JWT tokens
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    // Generic patterns
    /([Aa]pi[-_ ]?[Kk]ey|[Aa]ccess[-_ ]?[Kk]ey|[Ss]ecret[-_ ]?[Kk]ey|[Pp]rivate[-_ ]?[Kk]ey|[Aa]uth[-_ ]?[Tt]oken|[Bb]earer)[:=\s]+[\w-]{10,}/g,
    /([Pp]assword|[Pp]asswd|[Pp]wd)[:=\s]+\S+/g,
    /([Tt]oken|[Kk]ey|[Ss]ecret|[Cc]redential)[:=\s]+[\w-]{10,}/g,
  ];

  let sanitized = value;
  for (const pattern of apiKeyPatterns) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Preserve the label part if it exists
      const labelMatch = match.match(/^([^:=\s]+[:=\s]+)/);
      const label = labelMatch ? labelMatch[1] : '';
      return label + '[REDACTED]';
    });
  }

  return sanitized;
}

// Create validation error with safe message
export function createValidationError(field: string, value: unknown): Error {
  // Never include the actual value in error messages to prevent information leakage
  return new Error(`Invalid ${field} format`);
}