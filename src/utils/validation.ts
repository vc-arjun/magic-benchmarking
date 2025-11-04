/**
 * Comprehensive validation utilities for the Magic Benchmarking framework
 * Provides schema validation, input sanitization, and type guards
 */

import {
  Config,
  ProductConfig,
  NetworkConfig,
  CPUConfig,
  UserStateConfig,
  ExecutionConfig,
} from '../types/config';
import { ValidationError } from './errors';

/**
 * Validation result type
 */
export type ValidationResult<T> = {
  isValid: boolean;
  data?: T | undefined;
  errors: string[];
};

/**
 * Schema validator interface
 */
export interface Validator<T> {
  validate(input: unknown): ValidationResult<T>;
}

/**
 * Base validator class with common validation methods
 */
export abstract class BaseValidator<T> implements Validator<T> {
  abstract validate(input: unknown): ValidationResult<T>;

  protected createResult(isValid: boolean, data?: T, errors: string[] = []): ValidationResult<T> {
    return { isValid, data, errors };
  }

  protected isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  protected isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  protected isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  protected isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  protected isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  protected isPositiveNumber(value: unknown): value is number {
    return this.isNumber(value) && value > 0;
  }

  protected isNonNegativeNumber(value: unknown): value is number {
    return this.isNumber(value) && value >= 0;
  }

  protected isValidUrl(value: unknown): value is string {
    if (!this.isString(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Product configuration validator
 */
export class ProductConfigValidator extends BaseValidator<ProductConfig> {
  validate(input: unknown): ValidationResult<ProductConfig> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['Product config must be an object']);
    }

    const { name, entry_url, pom_file, enabled } = input;

    // Validate name
    if (!this.isString(name) || name.trim().length === 0) {
      errors.push('Product name must be a non-empty string');
    }

    // Validate entry_url
    if (!this.isValidUrl(entry_url)) {
      errors.push('Entry URL must be a valid URL');
    }

    // Validate pom_file - allow .ts files (development) or no extension (production)
    if (!this.isString(pom_file) || pom_file.trim() === '') {
      errors.push('POM file must be a non-empty string');
    } else if (!pom_file.endsWith('.ts') && pom_file.includes('.')) {
      errors.push('POM file must either be a TypeScript file (.ts extension) or a module name without extension');
    }

    // Validate enabled
    if (!this.isBoolean(enabled)) {
      errors.push('Enabled flag must be a boolean');
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as ProductConfig);
  }
}

/**
 * Network configuration validator
 */
export class NetworkConfigValidator extends BaseValidator<NetworkConfig> {
  validate(input: unknown): ValidationResult<NetworkConfig> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['Network config must be an object']);
    }

    const { download_throughput, upload_throughput, latency, enabled } = input;

    // Validate throughput values
    if (!this.isNonNegativeNumber(download_throughput)) {
      errors.push('Download throughput must be a non-negative number');
    }

    if (!this.isNonNegativeNumber(upload_throughput)) {
      errors.push('Upload throughput must be a non-negative number');
    }

    // Validate latency
    if (!this.isNonNegativeNumber(latency)) {
      errors.push('Latency must be a non-negative number');
    }

    // Validate enabled
    if (!this.isBoolean(enabled)) {
      errors.push('Enabled flag must be a boolean');
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as NetworkConfig);
  }
}

/**
 * CPU configuration validator
 */
export class CPUConfigValidator extends BaseValidator<CPUConfig> {
  validate(input: unknown): ValidationResult<CPUConfig> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['CPU config must be an object']);
    }

    const { rate, enabled } = input;

    // Validate rate
    if (!this.isPositiveNumber(rate)) {
      errors.push('CPU rate must be a positive number');
    }

    // Validate enabled
    if (!this.isBoolean(enabled)) {
      errors.push('Enabled flag must be a boolean');
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as CPUConfig);
  }
}

/**
 * User state configuration validator
 */
export class UserStateConfigValidator extends BaseValidator<UserStateConfig> {
  validate(input: unknown): ValidationResult<UserStateConfig> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['User state config must be an object']);
    }

    const { is_logged_in, enabled } = input;

    // Validate is_logged_in
    if (!this.isBoolean(is_logged_in)) {
      errors.push('is_logged_in must be a boolean');
    }

    // Validate enabled
    if (!this.isBoolean(enabled)) {
      errors.push('Enabled flag must be a boolean');
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as UserStateConfig);
  }
}

/**
 * Execution configuration validator
 */
export class ExecutionConfigValidator extends BaseValidator<ExecutionConfig> {
  validate(input: unknown): ValidationResult<ExecutionConfig> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['Execution config must be an object']);
    }

    const { iterations, timeout, headless, browsers, retry } = input;

    // Validate iterations
    if (!this.isPositiveNumber(iterations) || iterations < 1) {
      errors.push('Iterations must be a positive integer >= 1');
    }

    // Validate timeout
    if (!this.isPositiveNumber(timeout)) {
      errors.push('Timeout must be a positive number');
    }

    // Validate headless
    if (!this.isBoolean(headless)) {
      errors.push('Headless flag must be a boolean');
    }

    // Validate browsers
    if (!this.isArray(browsers) || browsers.length === 0) {
      errors.push('Browsers must be a non-empty array');
    } else {
      const validBrowsers = ['chromium', 'firefox', 'webkit'];
      const invalidBrowsers = browsers.filter((b) => !validBrowsers.includes(b as string));
      if (invalidBrowsers.length > 0) {
        errors.push(
          `Invalid browsers: ${invalidBrowsers.join(', ')}. Valid options: ${validBrowsers.join(', ')}`
        );
      }
    }

    // Validate retry config
    if (!this.isObject(retry)) {
      errors.push('Retry config must be an object');
    } else {
      const { max_attempts, delay_between_retries, save_progress_on_failure } = retry;

      if (!this.isPositiveNumber(max_attempts) || max_attempts < 1) {
        errors.push('Max attempts must be a positive integer >= 1');
      }

      if (!this.isNonNegativeNumber(delay_between_retries)) {
        errors.push('Delay between retries must be a non-negative number');
      }

      if (!this.isBoolean(save_progress_on_failure)) {
        errors.push('Save progress on failure must be a boolean');
      }
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as ExecutionConfig);
  }
}

/**
 * Main configuration validator
 */
export class ConfigValidator extends BaseValidator<Config> {
  private productValidator = new ProductConfigValidator();
  private networkValidator = new NetworkConfigValidator();
  private cpuValidator = new CPUConfigValidator();
  private userStateValidator = new UserStateConfigValidator();
  private executionValidator = new ExecutionConfigValidator();

  validate(input: unknown): ValidationResult<Config> {
    const errors: string[] = [];

    if (!this.isObject(input)) {
      return this.createResult(false, undefined, ['Config must be an object']);
    }

    const { products, execution_matrix, execution, output } = input;

    // Validate products
    if (!this.isArray(products) || products.length === 0) {
      errors.push('Products must be a non-empty array');
    } else {
      products.forEach((product, index) => {
        const result = this.productValidator.validate(product);
        if (!result.isValid) {
          errors.push(...result.errors.map((err) => `Product ${index}: ${err}`));
        }
      });
    }

    // Validate execution matrix
    if (!this.isObject(execution_matrix)) {
      errors.push('Execution matrix must be an object');
    } else {
      const { network, cpu, user_state } = execution_matrix;

      // Validate network configs
      if (!this.isObject(network)) {
        errors.push('Network configs must be an object');
      } else {
        Object.entries(network).forEach(([key, config]) => {
          const result = this.networkValidator.validate(config);
          if (!result.isValid) {
            errors.push(...result.errors.map((err) => `Network config '${key}': ${err}`));
          }
        });
      }

      // Validate CPU configs
      if (!this.isObject(cpu)) {
        errors.push('CPU configs must be an object');
      } else {
        Object.entries(cpu).forEach(([key, config]) => {
          const result = this.cpuValidator.validate(config);
          if (!result.isValid) {
            errors.push(...result.errors.map((err) => `CPU config '${key}': ${err}`));
          }
        });
      }

      // Validate user state configs
      if (!this.isObject(user_state)) {
        errors.push('User state configs must be an object');
      } else {
        Object.entries(user_state).forEach(([key, config]) => {
          const result = this.userStateValidator.validate(config);
          if (!result.isValid) {
            errors.push(...result.errors.map((err) => `User state config '${key}': ${err}`));
          }
        });
      }
    }

    // Validate execution config
    const executionResult = this.executionValidator.validate(execution);
    if (!executionResult.isValid) {
      errors.push(...executionResult.errors.map((err) => `Execution config: ${err}`));
    }

    // Validate output config
    if (!this.isObject(output)) {
      errors.push('Output config must be an object');
    } else {
      const { formats, directory } = output;

      if (!this.isArray(formats) || formats.length === 0) {
        errors.push('Output formats must be a non-empty array');
      } else {
        const validFormats = ['csv', 'json', 'html'];
        const invalidFormats = formats.filter((f) => !validFormats.includes(f as string));
        if (invalidFormats.length > 0) {
          errors.push(
            `Invalid output formats: ${invalidFormats.join(', ')}. Valid options: ${validFormats.join(', ')}`
          );
        }
      }

      if (!this.isString(directory) || directory.trim().length === 0) {
        errors.push('Output directory must be a non-empty string');
      }
    }

    if (errors.length > 0) {
      return this.createResult(false, undefined, errors);
    }

    return this.createResult(true, input as Config);
  }
}

/**
 * Utility functions for common validations
 */
export class ValidationUtils {
  /**
   * Validate and sanitize configuration
   */
  static validateConfig(config: unknown): Config {
    const validator = new ConfigValidator();
    const result = validator.validate(config);

    if (!result.isValid) {
      throw new ValidationError(`Configuration validation failed: ${result.errors.join('; ')}`, {
        errors: result.errors,
      });
    }

    return result.data!;
  }

  /**
   * Type guard for checking if value is defined
   */
  static isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
  }

  /**
   * Type guard for checking if string is not empty
   */
  static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: unknown): string {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  }

  /**
   * Validate numeric range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate file extension
   */
  static hasValidExtension(filename: string, allowedExtensions: string[]): boolean {
    const extension = filename.toLowerCase().split('.').pop();
    return extension ? allowedExtensions.includes(extension) : false;
  }
}
