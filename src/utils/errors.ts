/**
 * Comprehensive error handling utilities for the Magic Benchmarking framework
 * Provides structured error types, validation, and recovery mechanisms
 */

/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: string;
  readonly context?: Record<string, unknown> | undefined;

  constructor(message: string, context?: Record<string, unknown> | undefined) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Configuration validation errors
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 400;
}

/**
 * Browser automation errors
 */
export class BrowserError extends AppError {
  readonly code = 'BROWSER_ERROR';
  readonly statusCode = 500;
}

/**
 * Performance measurement errors
 */
export class PerformanceError extends AppError {
  readonly code = 'PERFORMANCE_ERROR';
  readonly statusCode = 500;
}

/**
 * Network monitoring errors
 */
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 500;
}

/**
 * File system operation errors
 */
export class FileSystemError extends AppError {
  readonly code = 'FILESYSTEM_ERROR';
  readonly statusCode = 500;
}

/**
 * Data validation errors
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Wrap async operations with error handling and retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      shouldRetry?: (error: Error) => boolean;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = this.MAX_RETRY_ATTEMPTS,
      delayMs = this.RETRY_DELAY_MS,
      shouldRetry = (error) =>
        !(error instanceof ValidationError || error instanceof ConfigurationError),
      onRetry,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts || !shouldRetry(lastError)) {
          throw lastError;
        }

        onRetry?.(attempt, lastError);

        // Exponential backoff with jitter
        const delay = delayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Safely execute operation with fallback
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: T | (() => T | Promise<T>)
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn('Operation failed, using fallback:', error);
      return typeof fallback === 'function' ? await (fallback as () => T | Promise<T>)() : fallback;
    }
  }

  /**
   * Log error with structured format
   */
  static logError(error: Error, context?: Record<string, unknown>): void {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof AppError) {
      console.error(`[${error.code}]`, errorInfo);
    } else {
      console.error('[UNKNOWN_ERROR]', errorInfo);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: Error): boolean {
    if (error instanceof AppError) {
      return ![ValidationError, ConfigurationError].some(
        (ErrorClass) => error instanceof ErrorClass
      );
    }

    // Common retryable error patterns
    const retryablePatterns = [/timeout/i, /network/i, /connection/i, /econnreset/i, /enotfound/i];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }
}

/**
 * Result wrapper for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wrap async operation in Result type
 */
export async function safeAsync<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await operation();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap sync operation in Result type
 */
export function safe<T>(operation: () => T): Result<T> {
  try {
    const data = operation();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}
