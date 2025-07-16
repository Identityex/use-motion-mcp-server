// Service Type Definitions
// Common types used across services

/**
 * Motion API Client interface
 */
export interface MotionAPIClient {
  get: <T = any>(url: string, options?: { params?: Record<string, any> }) => Promise<{ data: T }>;
  post: <T = any>(url: string, data?: any) => Promise<{ data: T }>;
  patch: <T = any>(url: string, data?: any) => Promise<{ data: T }>;
  delete: <T = any>(url: string) => Promise<{ data: T }>;
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