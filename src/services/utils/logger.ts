// Secure logging utility
// Provides structured logging with automatic secret sanitization

import { sanitizeForLog } from '../validation/validators.js';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

class ConsoleLogger implements Logger {
  private readonly level: LogLevel;
  private readonly context: LogContext;

  constructor(level: LogLevel = LogLevel.INFO, context: LogContext = {}) {
    this.level = level;
    this.context = context;
  }

  error(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.ERROR) {
      this.log('ERROR', message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.WARN) {
      this.log('WARN', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.INFO) {
      this.log('INFO', message, context);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.level >= LogLevel.DEBUG) {
      this.log('DEBUG', message, context);
    }
  }

  child(context: LogContext): Logger {
    return new ConsoleLogger(this.level, { ...this.context, ...context });
  }

  private log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = sanitizeForLog(message);
    const sanitizedContext = this.sanitizeContext({ ...this.context, ...context });
    
    const logEntry = {
      timestamp,
      level,
      message: sanitizedMessage,
      ...sanitizedContext,
    };

    // Use console.error for all logs to ensure they go to stderr in MCP
    try {
      console.error(JSON.stringify(logEntry));
    } catch (error) {
      // Fallback for non-serializable data - create a safe version
      const safeEntry = {
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        service: (logEntry as any).service || 'motion-mcp-server',
        pid: (logEntry as any).pid || process.pid,
        message: '[Serialization Error: ' + logEntry.message + ']',
        serializationError: error instanceof Error ? error.message : String(error)
      };
      console.error(JSON.stringify(safeEntry));
    }
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive keys entirely
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize values
      if (typeof value === 'string') {
        sanitized[key] = sanitizeForLog(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeValue(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeValue(value: unknown, seen = new WeakSet()): unknown {
    // Handle non-serializable types
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'function' || typeof value === 'symbol') {
      return '[Function/Symbol]';
    }
    
    if (Array.isArray(value)) {
      // Check for circular references
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      const result = value.map(item => this.sanitizeValue(item, seen));
      seen.delete(value);
      return result;
    }
    
    if (value && typeof value === 'object') {
      // Check for circular references
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (this.isSensitiveKey(k)) {
          sanitized[k] = '[REDACTED]';
        } else if (typeof v === 'string') {
          sanitized[k] = sanitizeForLog(v);
        } else {
          sanitized[k] = this.sanitizeValue(v, seen);
        }
      }
      
      seen.delete(value);
      return sanitized;
    }

    if (typeof value === 'string') {
      return sanitizeForLog(value);
    }

    return value;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /api[_-]?secret/i,
      /password/i,
      /passwd/i,
      /secret/i,
      /token/i,
      /auth/i,
      /credential/i,
      /private[_-]?key/i,
      /access[_-]?key/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }
}

// Create default logger instance
const logLevel = process.env.LOG_LEVEL 
  ? LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO
  : LogLevel.INFO;

export const logger: Logger = new ConsoleLogger(logLevel, {
  service: 'motion-mcp-server',
  pid: process.pid,
});

// Specialized loggers for different domains
export const createDomainLogger = (domain: string): Logger => {
  return logger.child({ domain });
};

// Request logger for MCP tools
export const createRequestLogger = (toolName: string, requestId: string): Logger => {
  return logger.child({ 
    domain: 'mcp',
    tool: toolName,
    requestId,
  });
};

// Performance logging utility
export class PerformanceLogger {
  private readonly logger: Logger;
  private readonly startTime: number;
  private readonly operation: string;

  constructor(logger: Logger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
    
    this.logger.info(`Starting ${operation}`);
  }

  end(context?: LogContext): void {
    const duration = Date.now() - this.startTime;
    this.logger.info(`Completed ${this.operation}`, {
      duration,
      ...context,
    });
  }

  error(error: unknown, context?: LogContext): void {
    const duration = Date.now() - this.startTime;
    this.logger.error(`Failed ${this.operation}`, {
      duration,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : String(error),
      ...context,
    });
  }
}