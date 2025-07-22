// Distributed lock manager for preventing concurrent operations
// Uses file-based locks for simplicity and cross-process safety

import * as fs from 'fs-extra';
import * as path from 'path';
import { createDomainLogger } from './logger.js';

export interface LockOptions {
  ttl?: number; // Time to live in milliseconds
  retries?: number; // Number of retries
  retryDelay?: number; // Delay between retries in milliseconds
}

export class LockManager {
  private readonly logger = createDomainLogger('lock-manager');
  private readonly lockDir: string;
  private readonly activeCleanups = new Map<string, NodeJS.Timeout>();

  constructor(lockDir: string = '.claude/locks') {
    this.lockDir = lockDir;
  }

  /**
   * Acquire a lock for the given resource
   */
  async acquire(
    resource: string,
    options: LockOptions = {}
  ): Promise<() => Promise<void>> {
    const {
      ttl = 30000, // 30 seconds default
      retries = 10,
      retryDelay = 1000, // 1 second
    } = options;

    const lockFile = this.getLockPath(resource);
    let attempts = 0;

    // Ensure lock directory exists
    await fs.ensureDir(this.lockDir);

    while (attempts < retries) {
      try {
        // Try to create lock file exclusively
        const lockData = {
          pid: process.pid,
          resource,
          acquiredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + ttl).toISOString(),
        };

        // Use exclusive flag to prevent race conditions
        await fs.writeFile(lockFile, JSON.stringify(lockData, null, 2), {
          flag: 'wx', // Write exclusive - fails if file exists
        });

        this.logger.info('Lock acquired', { resource, attempts: attempts + 1 });

        // Set up auto-cleanup
        const cleanup = setTimeout(() => {
          this.release(resource).catch(err => {
            this.logger.error('Auto-cleanup failed', { resource, error: err.message });
          });
        }, ttl);

        this.activeCleanups.set(resource, cleanup);

        // Return release function
        return async () => {
          await this.release(resource);
        };
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock exists, check if it's expired
          const isExpired = await this.checkAndCleanExpiredLock(lockFile);
          if (!isExpired) {
            attempts++;
            this.logger.debug('Lock exists, retrying', {
              resource,
              attempt: attempts,
              maxRetries: retries,
            });
            
            if (attempts < retries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            }
          }
          // If expired, it was cleaned up, so retry immediately
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Failed to acquire lock for ${resource} after ${retries} attempts`);
  }

  /**
   * Release a lock
   */
  async release(resource: string): Promise<void> {
    const lockFile = this.getLockPath(resource);
    
    try {
      // Clear auto-cleanup timer
      const cleanup = this.activeCleanups.get(resource);
      if (cleanup) {
        clearTimeout(cleanup);
        this.activeCleanups.delete(resource);
      }

      // Remove lock file
      await fs.remove(lockFile);
      this.logger.info('Lock released', { resource });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to release lock', { resource, error: error.message });
        throw error;
      }
      // Lock already released, ignore
    }
  }

  /**
   * Check if a lock exists
   */
  async isLocked(resource: string): Promise<boolean> {
    const lockFile = this.getLockPath(resource);
    try {
      const exists = await fs.pathExists(lockFile);
      if (!exists) return false;

      // Check if expired
      const isExpired = await this.checkAndCleanExpiredLock(lockFile);
      return !isExpired;
    } catch {
      return false;
    }
  }

  /**
   * Wait for a lock to be released
   */
  async waitForUnlock(
    resource: string,
    timeout: number = 60000
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 1000; // Check every second

    while (Date.now() - startTime < timeout) {
      const locked = await this.isLocked(resource);
      if (!locked) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Timeout waiting for lock on ${resource}`);
  }

  /**
   * Execute a function with a lock
   */
  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    options?: LockOptions
  ): Promise<T> {
    const release = await this.acquire(resource, options);
    try {
      return await fn();
    } finally {
      await release();
    }
  }

  /**
   * Clean up all expired locks
   */
  async cleanupExpiredLocks(): Promise<void> {
    try {
      await fs.ensureDir(this.lockDir);
      const files = await fs.readdir(this.lockDir);
      
      for (const file of files) {
        if (file.endsWith('.lock')) {
          const lockFile = path.join(this.lockDir, file);
          await this.checkAndCleanExpiredLock(lockFile);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired locks', { error });
    }
  }

  private getLockPath(resource: string): string {
    // Sanitize resource name for filesystem
    const safeName = resource.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.lockDir, `${safeName}.lock`);
  }

  private async checkAndCleanExpiredLock(lockFile: string): Promise<boolean> {
    try {
      const content = await fs.readFile(lockFile, 'utf-8');
      const lockData = JSON.parse(content);
      
      if (new Date(lockData.expiresAt) < new Date()) {
        // Lock is expired, remove it
        await fs.remove(lockFile);
        this.logger.info('Removed expired lock', { 
          resource: lockData.resource,
          expiredAt: lockData.expiresAt,
        });
        return true;
      }
      return false;
    } catch (error) {
      // If we can't read or parse the lock file, consider it invalid and remove it
      try {
        await fs.remove(lockFile);
        return true;
      } catch {
        return false;
      }
    }
  }
}

// Global lock manager instance
export const lockManager = new LockManager();

// Cleanup expired locks periodically
setInterval(() => {
  lockManager.cleanupExpiredLocks().catch(err => {
    console.error('Failed to cleanup expired locks:', err);
  });
}, 60000); // Every minute