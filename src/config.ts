import { Config } from './types/config';
import { ValidationUtils, ConfigurationError, logger } from './utils';

/**
 * Default configuration used as fallback when env variable is not available
 */
function getDefaultConfig(): Config {
  return {
    products: [
      {
        name: 'MagicCheckout',
        entry_url: 'https://razorpay.com/demopg3/',
        pom_file: 'magic-checkout',
        enabled: true,
      },
    ],
    execution_matrix: {
      network: {
        slow_4g: {
          download_throughput: 500000, // 500kbps 
          upload_throughput: 500000, // 500kbps
          latency: 400, // 400ms
          enabled: true,
        },
        no_throttling: {
          download_throughput: 0, // 0Mbps 
          upload_throughput: 0, // 0Mbps  
          latency: 0,
          enabled: true,
        },
      },
      cpu: {
        no_throttling: {
          rate: 1,
          enabled: true,
        },
        '4x_slowdown': {
          rate: 4,
          enabled: false,
        },
      },
      user_state: {
        new_user: {
          is_logged_in: true,
          enabled: true,
        },
      },
    },
    execution: {
      iterations: 20,
      timeout: 120000, // 2 minutes for slow network conditions
      headless: true,
      browsers: ['chromium'],
      retry: {
        max_attempts: 3, // Total attempts (1 initial + 2 retries)
        delay_between_retries: 3000, // 3 seconds delay between retries
      },
    },
    output: {
      formats: ['json', 'csv'],
      directory: './dashboard/public/results',
    },
  };
}

/**
 * Load configuration from environment variables or use default configuration
 */
function loadConfigFromEnv(): Config {
  // Check for legacy JSON config first
  const configEnvVar = process.env.MAGIC_BENCHMARKING_CONFIG;
  
  if (configEnvVar) {
    try {
      const parsedConfig = JSON.parse(configEnvVar) as Config;
      logger.info('Configuration loaded from MAGIC_BENCHMARKING_CONFIG JSON', {
        source: 'json_environment',
        productsCount: parsedConfig.products?.length || 0,
      });
      return parsedConfig;
    } catch (error) {
      logger.warn('Failed to parse MAGIC_BENCHMARKING_CONFIG, falling back to individual env vars or defaults', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Check for individual environment variables
  const hasIndividualEnvVars = 
    process.env.BENCHMARK_ITERATIONS ||
    process.env.BENCHMARK_NETWORK_SLOW_4G ||
    process.env.BENCHMARK_NETWORK_NO_THROTTLING ||
    process.env.BENCHMARK_CPU_4X_SLOWDOWN ||
    process.env.BENCHMARK_CPU_NO_THROTTLING;

  if (hasIndividualEnvVars) {
    logger.info('Building configuration from individual environment variables');
    return buildConfigFromIndividualEnvVars();
  }

  logger.info('No configuration environment variables found, using default configuration');
  return getDefaultConfig();
}

/**
 * Build configuration from individual environment variables
 */
function buildConfigFromIndividualEnvVars(): Config {
  const defaultConfig = getDefaultConfig();
  
  // Parse iterations
  const iterations = process.env.BENCHMARK_ITERATIONS 
    ? parseInt(process.env.BENCHMARK_ITERATIONS, 10) 
    : defaultConfig.execution.iterations;
  
  // Parse boolean environment variables (GitHub Actions passes 'true'/'false' as strings)
  const networkSlow4g = process.env.BENCHMARK_NETWORK_SLOW_4G === 'true';
  const networkNoThrottling = process.env.BENCHMARK_NETWORK_NO_THROTTLING === 'true';
  const cpu4xSlowdown = process.env.BENCHMARK_CPU_4X_SLOWDOWN === 'true';
  const cpuNoThrottling = process.env.BENCHMARK_CPU_NO_THROTTLING === 'true';
  
  // Apply smart defaults: if no conditions are selected, enable no_throttling for both
  const finalNetworkNoThrottling = networkNoThrottling || (!networkSlow4g && !networkNoThrottling);
  const finalCpuNoThrottling = cpuNoThrottling || (!cpu4xSlowdown && !cpuNoThrottling);
  
  logger.info('Configuration built from individual environment variables', {
    iterations,
    networkConditions: {
      slow_4g: networkSlow4g,
      no_throttling: finalNetworkNoThrottling,
    },
    cpuConditions: {
      '4x_slowdown': cpu4xSlowdown,
      no_throttling: finalCpuNoThrottling,
    },
  });
  
  return {
    ...defaultConfig,
    execution: {
      ...defaultConfig.execution,
      iterations,
    },
    execution_matrix: {
      ...defaultConfig.execution_matrix,
      network: {
        ...defaultConfig.execution_matrix.network,
        slow_4g: {
          ...defaultConfig.execution_matrix.network.slow_4g,
          enabled: networkSlow4g,
        },
        no_throttling: {
          ...defaultConfig.execution_matrix.network.no_throttling,
          enabled: finalNetworkNoThrottling,
        },
      },
      cpu: {
        ...defaultConfig.execution_matrix.cpu,
        no_throttling: {
          ...defaultConfig.execution_matrix.cpu.no_throttling,
          enabled: finalCpuNoThrottling,
        },
        '4x_slowdown': {
          ...defaultConfig.execution_matrix.cpu['4x_slowdown'],
          enabled: cpu4xSlowdown,
        },
      },
    },
  };
}

/**
 * Load and validate configuration with comprehensive error handling
 */
function loadConfig(): Config {
  const rawConfig = loadConfigFromEnv();

  try {
    // Validate configuration
    const validatedConfig = ValidationUtils.validateConfig(rawConfig);
    logger.info('Configuration loaded and validated successfully', {
      productsCount: validatedConfig.products.length,
      enabledProducts: validatedConfig.products.filter(p => p.enabled).length,
      iterations: validatedConfig.execution.iterations,
      outputFormats: validatedConfig.output.formats,
    });
    return validatedConfig;
  } catch (error) {
    logger.error('Configuration validation failed', error instanceof Error ? error : new Error(String(error)));
    throw new ConfigurationError(
      'Invalid configuration detected. Please check your config values.',
      { originalError: error }
    );
  }
}

/**
 * Validated configuration instance
 */
export const CONFIG = loadConfig();
