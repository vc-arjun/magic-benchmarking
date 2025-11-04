/**
 * Comprehensive logging utility for the Magic Benchmarking framework
 * Provides structured logging with different levels, contexts, and output formats
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown> | undefined;
  error?: Error | undefined;
  module?: string | undefined;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string | undefined;
  enableStructured: boolean;
  includeStackTrace: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableStructured: false,
  includeStackTrace: true,
};

/**
 * Logger class with multiple output formats and levels
 */
export class Logger {
  private config: LoggerConfig;
  private module?: string | undefined;

  constructor(config: Partial<LoggerConfig> = {}, module?: string | undefined) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.module = module;
  }

  /**
   * Create a child logger with a specific module context
   */
  child(module: string): Logger {
    return new Logger(this.config, module);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log performance metrics
   */
  metric(metricName: string, value: number, unit: string, context?: Record<string, unknown>): void {
    this.info(`METRIC: ${metricName}`, {
      metric: metricName,
      value,
      unit,
      ...context,
    });
  }

  /**
   * Log execution timing
   */
  time<T>(label: string, operation: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();

    const logEnd = (_result?: T, error?: Error) => {
      const duration = performance.now() - start;
      const context = { duration: `${Math.round(duration * 100) / 100}ms` };

      if (error) {
        this.error(`TIMING: ${label} failed`, error, context);
      } else {
        this.info(`TIMING: ${label} completed`, context);
      }
    };

    try {
      const result = operation();

      if (result instanceof Promise) {
        return result
          .then((res) => {
            logEnd(res);
            return res;
          })
          .catch((err) => {
            logEnd(undefined, err);
            throw err;
          });
      } else {
        logEnd(result);
        return result;
      }
    } catch (error) {
      logEnd(undefined, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        ...(this.module && { module: this.module }),
      },
      error,
      module: this.module,
    };

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(entry);
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const module = entry.module ? `[${entry.module}]` : '';

    if (this.config.enableStructured) {
      console.log(JSON.stringify(entry, null, 2));
      return;
    }

    const baseMessage = `${timestamp} ${levelName} ${module} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(baseMessage, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(baseMessage, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(baseMessage, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(baseMessage, entry.context || '');
        if (entry.error && this.config.includeStackTrace) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Log to file (async operation)
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      if (!this.config.filePath) return;

      // Ensure directory exists
      const dir = path.dirname(this.config.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Format log entry
      const logLine = this.config.enableStructured
        ? JSON.stringify(entry) + '\n'
        : this.formatLogLine(entry) + '\n';

      // Append to file
      await fs.appendFile(this.config.filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Format log entry for file output
   */
  private formatLogLine(entry: LogEntry): string {
    const levelName = LogLevel[entry.level].padEnd(5);
    const module = entry.module ? `[${entry.module}]` : '';
    let line = `${entry.timestamp} ${levelName} ${module} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      line += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      line += ` | Error: ${entry.error.message}`;
      if (this.config.includeStackTrace && entry.error.stack) {
        line += ` | Stack: ${entry.error.stack.replace(/\n/g, ' ')}`;
      }
    }

    return line;
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableFile: false,
  enableStructured: false,
  includeStackTrace: true,
});

/**
 * Create module-specific logger
 */
export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(config, module);
}

/**
 * Performance monitoring decorator
 */
export function logPerformance(
  target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;
  const methodLogger = createLogger(`${target?.constructor?.name || 'Unknown'}.${propertyName}`);

  descriptor.value = function (...args: unknown[]) {
    return methodLogger.time(`${propertyName}()`, () => originalMethod.apply(this, args));
  };
}

/**
 * Error logging decorator
 */
export function logErrors(
  target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor
): void {
  const originalMethod = descriptor.value;
  const methodLogger = createLogger(`${target?.constructor?.name || 'Unknown'}.${propertyName}`);

  descriptor.value = async function (...args: unknown[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      methodLogger.error(
        `Method ${propertyName} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { args: args.length }
      );
      throw error;
    }
  };
}

/**
 * Utility functions for common logging patterns
 */
export class LogUtils {
  /**
   * Log execution context for debugging
   */
  static logExecutionContext(
    context: Record<string, unknown>,
    loggerInstance: Logger = logger
  ): void {
    loggerInstance.debug('Execution context', {
      ...context,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    });
  }

  /**
   * Log system information
   */
  static logSystemInfo(loggerInstance: Logger = logger): void {
    loggerInstance.info('System information', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    });
  }

  /**
   * Create a request ID for tracing
   */
  static createRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Log with request ID for tracing
   */
  static withRequestId(requestId: string, loggerInstance: Logger = logger): Logger {
    return loggerInstance.child(`req:${requestId}`);
  }
}
