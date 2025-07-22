// Rate limit tracking and monitoring
// Provides insights into API usage and rate limit status

import { createDomainLogger } from '../utils/logger.js';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitTracker {
  /**
   * Update rate limit information from response headers
   */
  updateFromHeaders(endpoint: string, headers: Record<string, string>): void;
  
  /**
   * Get current rate limit info for an endpoint
   */
  getInfo(endpoint: string): RateLimitInfo | undefined;
  
  /**
   * Check if we should delay before making a request
   */
  shouldDelay(endpoint: string): { delay: boolean; waitMs?: number };
  
  /**
   * Get a summary of all rate limit statuses
   */
  getSummary(): Record<string, { 
    percentUsed: number;
    remaining: number; 
    resetIn: number;
  }>;
  
  /**
   * Clear expired rate limit info
   */
  cleanup(): void;
}

// Factory function to create RateLimitTracker (FRP pattern)
export function createRateLimitTracker(): RateLimitTracker {
  const logger = createDomainLogger('rate-limit');
  const rateLimitInfo = new Map<string, RateLimitInfo>();
  
  return {
    updateFromHeaders(endpoint: string, headers: Record<string, string>): void {
      const limit = parseInt(headers['x-ratelimit-limit'] || '0', 10);
      const remaining = parseInt(headers['x-ratelimit-remaining'] || '0', 10);
      const reset = parseInt(headers['x-ratelimit-reset'] || '0', 10);
      const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined;

      if (limit > 0) {
        const info: RateLimitInfo = {
          limit,
          remaining,
          reset: new Date(reset * 1000),
          retryAfter,
        };

        rateLimitInfo.set(endpoint, info);
        
        // Log warning if approaching limit
        const percentUsed = ((limit - remaining) / limit) * 100;
        if (percentUsed > 80) {
          logger.warn('Approaching rate limit', {
            endpoint,
            percentUsed: Math.round(percentUsed),
            remaining,
            resetIn: Math.round((info.reset.getTime() - Date.now()) / 1000),
          });
        }
      }
    },

    getInfo(endpoint: string): RateLimitInfo | undefined {
      return rateLimitInfo.get(endpoint);
    },

    shouldDelay(endpoint: string): { delay: boolean; waitMs?: number } {
      const info = rateLimitInfo.get(endpoint);
      if (!info) {
        return { delay: false };
      }

      // If we have a retry-after header, use that
      if (info.retryAfter) {
        return {
          delay: true,
          waitMs: info.retryAfter * 1000,
        };
      }

      // If we're out of requests, wait until reset
      if (info.remaining === 0) {
        const waitMs = Math.max(0, info.reset.getTime() - Date.now());
        return {
          delay: true,
          waitMs,
        };
      }

      // If we're very close to the limit, add a small delay
      if (info.remaining < 5) {
        return {
          delay: true,
          waitMs: 1000, // 1 second delay
        };
      }

      return { delay: false };
    },

    getSummary(): Record<string, { 
      percentUsed: number;
      remaining: number; 
      resetIn: number;
    }> {
      const summary: Record<string, any> = {};
      
      for (const [endpoint, info] of rateLimitInfo.entries()) {
        const percentUsed = ((info.limit - info.remaining) / info.limit) * 100;
        const resetIn = Math.max(0, Math.round((info.reset.getTime() - Date.now()) / 1000));
        
        summary[endpoint] = {
          percentUsed: Math.round(percentUsed),
          remaining: info.remaining,
          resetIn,
        };
      }
      
      return summary;
    },

    cleanup(): void {
      const now = Date.now();
      for (const [endpoint, info] of rateLimitInfo.entries()) {
        if (info.reset.getTime() < now) {
          rateLimitInfo.delete(endpoint);
        }
      }
    },
  };
}

// Global rate limit tracker instance (using FRP factory)
export const rateLimitTracker = createRateLimitTracker();

// Cleanup expired entries every minute
setInterval(() => {
  rateLimitTracker.cleanup();
}, 60000);