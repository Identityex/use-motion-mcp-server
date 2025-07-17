// Centralized error handling utilities
// Provides consistent error formatting and security

import { MCPToolResponse } from '../../api/mcp/v1-routes/models';
import { sanitizeForLog } from '../validation/validators';
import { z } from 'zod';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  TRANSACTION = 'TRANSACTION_ERROR',
}

// Base error class with additional context
export class AppError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.VALIDATION, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found` : `${resource} not found`;
    super(message, ErrorType.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, ErrorType.CONFLICT, 409, details);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, ErrorType.UNAUTHORIZED, 401);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, ErrorType.RATE_LIMIT, 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, statusCode?: number) {
    super(`${service} error: ${message}`, ErrorType.EXTERNAL_SERVICE, statusCode || 502);
    this.name = 'ExternalServiceError';
  }
}

// Error handler for MCP controllers
export function handleControllerError(error: unknown): MCPToolResponse {
  // Log the error securely (without exposing sensitive data)
  const sanitizedError = sanitizeError(error);
  console.error('Controller error:', sanitizedError);

  // Convert to user-friendly response
  const errorResponse = formatErrorResponse(error);
  
  return {
    content: [{
      type: 'text',
      text: errorResponse,
    }],
    isError: true,
  };
}

// Sanitize error for logging (remove sensitive data)
function sanitizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeForLog(error.message),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      type: error instanceof AppError ? error.type : 'UNKNOWN',
    };
  }
  return { error: sanitizeForLog(String(error)) };
}

// Format error for user response
function formatErrorResponse(error: unknown): string {
  // Handle known error types
  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`;
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof ConflictError) {
    return `Conflict: ${error.message}`;
  }
  
  if (error instanceof UnauthorizedError) {
    return 'Unauthorized: Please check your credentials';
  }
  
  if (error instanceof RateLimitError) {
    return 'Rate limit exceeded. Please try again later.';
  }
  
  if (error instanceof ExternalServiceError) {
    return `External service error: ${error.message}`;
  }
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return `Validation error: ${issues}`;
  }
  
  // Handle Motion API errors
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const apiError = error as any;
    if (apiError.statusCode === 429) {
      return 'Motion API rate limit exceeded. Please try again later.';
    }
    if (apiError.statusCode === 401) {
      return 'Motion API authentication failed. Please check your API key.';
    }
    if (apiError.statusCode === 404) {
      return 'Resource not found in Motion.';
    }
    return `Motion API error: ${apiError.message || 'Unknown error'}`;
  }
  
  // Generic error handling
  if (error instanceof Error) {
    // Don't expose internal error details to users
    return 'An error occurred while processing your request.';
  }
  
  return 'An unexpected error occurred.';
}

// Async error handler wrapper
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // Re-throw to be handled by the controller error handler
    }
  }) as T;
}

// Create a controller method wrapper
export function wrapControllerMethod<T extends (...args: any[]) => Promise<MCPToolResponse>>(
  method: T,
  methodName: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await method(...args);
    } catch (error) {
      console.error(`Error in ${methodName}:`, sanitizeError(error));
      return handleControllerError(error);
    }
  }) as T;
}

// Utility to wrap all methods of a controller
export function wrapController<T extends Record<string, any>>(
  controller: T,
  controllerName: string
): T {
  const wrapped: any = {};
  
  for (const [methodName, method] of Object.entries(controller)) {
    if (typeof method === 'function') {
      wrapped[methodName] = wrapControllerMethod(
        method.bind(controller),
        `${controllerName}.${methodName}`
      );
    } else {
      wrapped[methodName] = method;
    }
  }
  
  return wrapped as T;
}