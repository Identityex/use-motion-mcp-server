// Service Type Definitions
// Common types used across services

/**
 * Motion API Client interface
 */
export interface MotionAPIClient {
  get: <T = unknown>(url: string, options?: { params?: Record<string, unknown> }) => Promise<{ data: T }>;
  post: <T = unknown>(url: string, data?: unknown) => Promise<{ data: T }>;
  patch: <T = unknown>(url: string, data?: unknown) => Promise<{ data: T }>;
  delete: <T = unknown>(url: string) => Promise<{ data: T }>;
}

/**
 * Service Result pattern
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
}