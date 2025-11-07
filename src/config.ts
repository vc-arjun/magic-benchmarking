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
      {
        name: 'Gokwik',
        entry_url: 'https://neemans.com/collections/all-products',
        pom_file: 'gokwik',
        enabled: true,
      },
    ],
    execution_matrix: {
      network: {
        slow_4g: {
          download_throughput: 350000, // 350kbps
          upload_throughput: 200000, // 200kbps
          latency: 400, // 400ms
          connection_type: 'cellular3g',
          enabled: true,
        },
        fast_4g: {
          download_throughput: 2000000, // 2Mbps
          upload_throughput: 1000000, // 1Mbps
          latency: 120, // 120ms
          connection_type: 'cellular4g',
          enabled: true,
        },
        no_throttling: {
          download_throughput: -1,
          upload_throughput: -1,
          latency: 0,
          connection_type: 'wifi',
          enabled: true,
        },
      },
      cpu: {
        no_throttling: {
          rate: 1, // High-end devices (flagship phones, desktops)
          enabled: true,
        },
        '2x_slowdown': {
          rate: 4,
          enabled: true,
        },
        '4x_slowdown': {
          rate: 6,
          enabled: true,
        },
      },
      user_state: {
        new_user: {
          is_logged_in: false,
          enabled: true,
        },
      },
    },
    execution: {
      iterations: 2,
      timeout: 60000,
      headless: true,
      browsers: ['chromium'],
      viewport: {
        width: 390,
        height: 844,
      },
      retry: {
        max_attempts: 3, // Total attempts (1 initial + 2 retries)
        delay_between_retries: 5000, // 5 seconds delay for slow networks
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
      logger.warn(
        'Failed to parse MAGIC_BENCHMARKING_CONFIG, falling back to individual env vars or defaults',
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // Check for individual environment variables
  const hasIndividualEnvVars =
    process.env.BENCHMARK_ITERATIONS ||
    process.env.BENCHMARK_NETWORK_SLOW_4G ||
    process.env.BENCHMARK_NETWORK_FAST_4G ||
    process.env.BENCHMARK_NETWORK_NO_THROTTLING ||
    process.env.BENCHMARK_CPU_2X_SLOWDOWN ||
    process.env.BENCHMARK_CPU_4X_SLOWDOWN ||
    process.env.BENCHMARK_CPU_NO_THROTTLING ||
    process.env.BENCHMARK_PRODUCT_GOKWIK ||
    process.env.BENCHMARK_PRODUCT_MAGIC_CHECKOUT;

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
  const networkFast4g = process.env.BENCHMARK_NETWORK_FAST_4G === 'true';
  const networkNoThrottling = process.env.BENCHMARK_NETWORK_NO_THROTTLING === 'true';
  const cpu2xSlowdown = process.env.BENCHMARK_CPU_2X_SLOWDOWN === 'true';
  const cpu4xSlowdown = process.env.BENCHMARK_CPU_4X_SLOWDOWN === 'true';
  const cpuNoThrottling = process.env.BENCHMARK_CPU_NO_THROTTLING === 'true';

  const productMagicCheckout =
    process.env.BENCHMARK_PRODUCT_MAGIC_CHECKOUT === undefined ||
    process.env.BENCHMARK_PRODUCT_MAGIC_CHECKOUT === '' ||
    process.env.BENCHMARK_PRODUCT_MAGIC_CHECKOUT === 'true';
  const productGokwik =
    process.env.BENCHMARK_PRODUCT_GOKWIK === undefined ||
    process.env.BENCHMARK_PRODUCT_GOKWIK === '' ||
    process.env.BENCHMARK_PRODUCT_GOKWIK === 'true';

  logger.info('Product configuration from environment variables', {
    BENCHMARK_PRODUCT_MAGIC_CHECKOUT: process.env.BENCHMARK_PRODUCT_MAGIC_CHECKOUT,
    BENCHMARK_PRODUCT_GOKWIK: process.env.BENCHMARK_PRODUCT_GOKWIK,
    productMagicCheckout,
    productGokwik,
  });

  // Ensure at least one product is enabled
  if (!productMagicCheckout && !productGokwik) {
    logger.warn('No products enabled, this should not happen with default configuration');
  }

  // Apply smart defaults: if no conditions are selected, enable no_throttling for both
  const finalNetworkNoThrottling =
    networkNoThrottling || (!networkSlow4g && !networkFast4g && !networkNoThrottling);
  const finalCpuNoThrottling =
    cpuNoThrottling || (!cpu2xSlowdown && !cpu4xSlowdown && !cpuNoThrottling);

  logger.info('Configuration built from individual environment variables', {
    iterations,
    networkConditions: {
      slow_4g: networkSlow4g,
      fast_4g: networkFast4g,
      no_throttling: finalNetworkNoThrottling,
    },
    cpuConditions: {
      '2x_slowdown': cpu2xSlowdown,
      '4x_slowdown': cpu4xSlowdown,
      no_throttling: finalCpuNoThrottling,
    },
  });

  return {
    ...defaultConfig,
    products: defaultConfig.products.map((p) => ({
      ...p,
      enabled:
        p.name === 'MagicCheckout'
          ? productMagicCheckout
          : p.name === 'Gokwik'
            ? productGokwik
            : p.enabled,
    })),
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
        fast_4g: {
          ...defaultConfig.execution_matrix.network.fast_4g,
          enabled: networkFast4g,
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
        '2x_slowdown': {
          ...defaultConfig.execution_matrix.cpu['2x_slowdown'],
          enabled: cpu2xSlowdown,
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
      enabledProducts: validatedConfig.products.filter((p) => p.enabled).length,
      iterations: validatedConfig.execution.iterations,
      outputFormats: validatedConfig.output.formats,
    });
    return validatedConfig;
  } catch (error) {
    logger.error(
      'Configuration validation failed',
      error instanceof Error ? error : new Error(String(error))
    );
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
