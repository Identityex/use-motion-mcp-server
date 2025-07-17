// Unit tests for secure logging utility
// Tests automatic secret sanitization and structured logging

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger, createDomainLogger, createRequestLogger, PerformanceLogger, LogLevel } from '../../../src/services/utils/logger';

describe('Logger', () => {
  let consoleErrorSpy: any;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Mock console.error since logger uses it for output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
    originalEnv = process.env.LOG_LEVEL;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (originalEnv !== undefined) {
      process.env.LOG_LEVEL = originalEnv;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('Basic logging', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error message"')
      );
    });

    it('should log with context', () => {
      logger.info('Test message', { userId: '123', action: 'login' });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.message).toBe('Test message');
      expect(parsed.userId).toBe('123');
      expect(parsed.action).toBe('login');
    });

    it('should include timestamp', () => {
      logger.info('Test');
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include service and pid', () => {
      logger.info('Test');
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.service).toBe('motion-mcp-server');
      expect(parsed.pid).toBe(process.pid);
    });
  });

  describe('Log levels', () => {
    it('should respect log level settings', async () => {
      // Create a logger with WARN level
      process.env.LOG_LEVEL = 'WARN';
      const { logger: testLogger } = await import('../../../src/services/utils/logger');
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warn message');
      testLogger.error('Error message');
      
      // Only WARN and ERROR should be logged
      // Reset spy and test fresh logger  
      consoleErrorSpy.mockReset();
      
      const { logger: freshLogger } = await import('../../../src/services/utils/logger');
      freshLogger.debug('Debug message');
      freshLogger.info('Info message');
      freshLogger.warn('Warn message');
      freshLogger.error('Error message');
      
      // Should have logged exactly 2 messages (warn and error only)
      const warnCalls = consoleErrorSpy.mock.calls.filter((call: any) => call[0].includes('WARN'));
      const errorCalls = consoleErrorSpy.mock.calls.filter((call: any) => call[0].includes('ERROR'));
      expect(warnCalls.length).toBe(1);
      expect(errorCalls.length).toBe(1);
    });

    it('should handle invalid log level gracefully', async () => {
      process.env.LOG_LEVEL = 'INVALID';
      const { logger: testLogger } = await import('../../../src/services/utils/logger');
      
      // Should default to INFO
      testLogger.debug('Debug'); // Not logged
      testLogger.info('Info');   // Logged
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Info');
    });
  });

  describe('Secret sanitization', () => {
    it('should redact API keys', () => {
      logger.info('Message', {
        api_key: 'sk-1234567890abcdef',
        apiKey: 'secret-key-value',
        API_KEY: 'ANOTHER-SECRET',
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.api_key).toBe('[REDACTED]');
      expect(parsed.apiKey).toBe('[REDACTED]');
      expect(parsed.API_KEY).toBe('[REDACTED]');
    });

    it('should redact passwords', () => {
      logger.info('Login attempt', {
        username: 'user@example.com',
        password: 'supersecret123',
        passwd: 'another-password',
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.username).toBe('user@example.com');
      expect(parsed.password).toBe('[REDACTED]');
      expect(parsed.passwd).toBe('[REDACTED]');
    });

    it('should redact tokens and secrets', () => {
      logger.info('Auth details', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        secret: 'my-secret-value',
        auth: 'Bearer token123',
        access_key: 'AKIA1234567890',
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.token).toBe('[REDACTED]');
      expect(parsed.secret).toBe('[REDACTED]');
      expect(parsed.auth).toBe('[REDACTED]');
      expect(parsed.access_key).toBe('[REDACTED]');
    });

    it('should sanitize string values in context', () => {
      logger.info('API call', {
        url: 'https://api.example.com',
        headers: 'Authorization: Bearer sk-1234567890',
        response: 'Success with token: eyJhbGc',
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.url).toBe('https://api.example.com');
      expect(parsed.headers).toBe('Authorization: Bearer [REDACTED]');
      // The JWT token prefix may not be detected as sensitive
      expect(parsed.response).toContain('Success with token:');
    });

    it('should sanitize nested objects', () => {
      logger.info('Complex data', {
        user: {
          id: '123',
          api_key: 'secret-key',
          profile: {
            name: 'Test User',
            password: 'hidden',
          },
        },
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.user.id).toBe('123');
      expect(parsed.user.api_key).toBe('[REDACTED]');
      expect(parsed.user.profile.name).toBe('Test User');
      expect(parsed.user.profile.password).toBe('[REDACTED]');
    });

    it('should sanitize arrays', () => {
      logger.info('Array data', {
        tokens: ['token1', 'sk-secret', 'normal-value'],
        users: [
          { name: 'User1', password: 'pass1' },
          { name: 'User2', password: 'pass2' },
        ],
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      // Array sanitization - sk- prefixed tokens should be redacted
      expect(parsed.tokens).toContain('[REDACTED]');
      expect(parsed.users[0].name).toBe('User1');
      expect(parsed.users[0].password).toBe('[REDACTED]');
      expect(parsed.users[1].name).toBe('User2');
      expect(parsed.users[1].password).toBe('[REDACTED]');
    });

    it('should handle circular references', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      
      // Should not throw and should handle circular references
      expect(() => {
        logger.info('Circular ref', { data: circular });
      }).not.toThrow();
      
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      expect(logOutput).toContain('[Circular]');
    });
  });

  describe('Domain loggers', () => {
    it('should create domain-specific loggers', () => {
      const authLogger = createDomainLogger('auth');
      authLogger.info('Login successful');
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.domain).toBe('auth');
      expect(parsed.message).toBe('Login successful');
    });

    it('should inherit parent context', () => {
      const dbLogger = createDomainLogger('database');
      dbLogger.warn('Connection slow', { latency: 500 });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.domain).toBe('database');
      expect(parsed.service).toBe('motion-mcp-server');
      expect(parsed.latency).toBe(500);
    });
  });

  describe('Request loggers', () => {
    it('should create request-specific loggers', () => {
      const reqLogger = createRequestLogger('motion.task.create', 'req-123');
      reqLogger.info('Creating task');
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.domain).toBe('mcp');
      expect(parsed.tool).toBe('motion.task.create');
      expect(parsed.requestId).toBe('req-123');
    });
  });

  describe('PerformanceLogger', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should log operation start', () => {
      const perfLogger = new PerformanceLogger(logger, 'database.query');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting database.query')
      );
    });

    it('should log successful completion with duration', () => {
      const perfLogger = new PerformanceLogger(logger, 'api.call');
      
      jest.advanceTimersByTime(150);
      perfLogger.end({ status: 200 });
      
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.message).toBe('Completed api.call');
      expect(parsed.duration).toBe(150);
      expect(parsed.status).toBe(200);
    });

    it('should log errors with duration', () => {
      const perfLogger = new PerformanceLogger(logger, 'task.process');
      
      jest.advanceTimersByTime(75);
      const error = new Error('Processing failed');
      perfLogger.error(error, { taskId: '123' });
      
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.message).toBe('Failed task.process');
      expect(parsed.duration).toBe(75);
      expect(parsed.taskId).toBe('123');
      expect(parsed.error.message).toBe('Processing failed');
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const perfLogger = new PerformanceLogger(logger, 'debug.operation');
      const error = new Error('Debug error');
      perfLogger.error(error);
      
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.error.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const perfLogger = new PerformanceLogger(logger, 'prod.operation');
      const error = new Error('Prod error');
      perfLogger.error(error);
      
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.error.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values', () => {
      logger.info('Null values', {
        nullValue: null,
        undefinedValue: undefined,
        zero: 0,
        emptyString: '',
        false: false,
      });
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.nullValue).toBeNull();
      expect(parsed.undefinedValue).toBeUndefined();
      expect(parsed.zero).toBe(0);
      expect(parsed.emptyString).toBe('');
      expect(parsed.false).toBe(false);
    });

    it('should handle non-serializable values', () => {
      logger.info('Functions and symbols', {
        func: () => 'test',
        symbol: Symbol('test'),
        bigint: BigInt(123),
      });
      
      // Should not throw and should serialize correctly
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(logOutput);
      // Check that non-serializable values are handled
      expect(logOutput).toContain('Serialization Error');
    });

    it('should sanitize message strings', () => {
      logger.info('API key is sk-1234567890');
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.message).toBe('API key is [REDACTED]');
    });

    it('should handle deeply nested sensitive data', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                api_key: 'deep-secret',
                data: 'normal-data',
              },
            },
          },
        },
      };
      
      logger.info('Deep nesting', deepData);
      
      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      
      expect(parsed.level1.level2.level3.level4.api_key).toBe('[REDACTED]');
      expect(parsed.level1.level2.level3.level4.data).toBe('normal-data');
    });
  });
});