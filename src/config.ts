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
          download_throughput: 200000, // 200kbps
          upload_throughput: 100000, // 200kbps
          latency: 500, // 400ms
          connection_type: 'cellular3g',
          enabled: true,
        },
        fast_4g: {
          download_throughput: 1500000, // 1.5Mbps
          upload_throughput: 500000, // 500kbps
          latency: 150, // 150ms
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
      iterations: 1,
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
 * Build configuration from comma-separated environment variables
 */
function buildConfigFromCommaSeparatedEnvVars(): Config {
  const defaultConfig = getDefaultConfig();

  // Parse iterations
  const iterations = process.env.BENCHMARK_ITERATIONS
    ? parseInt(process.env.BENCHMARK_ITERATIONS, 10)
    : defaultConfig.execution.iterations;

  // Parse comma-separated network conditions
  const networkConditions = process.env.BENCHMARK_NETWORK_CONDITIONS
    ? process.env.BENCHMARK_NETWORK_CONDITIONS.split(',').map((s) => s.trim())
    : ['no_throttling'];

  // Parse comma-separated CPU conditions
  const cpuConditions = process.env.BENCHMARK_CPU_CONDITIONS
    ? process.env.BENCHMARK_CPU_CONDITIONS.split(',').map((s) => s.trim())
    : ['2x_slowdown', 'no_throttling'];

  // Parse comma-separated products
  const products = process.env.BENCHMARK_PRODUCTS
    ? process.env.BENCHMARK_PRODUCTS.split(',').map((s) => s.trim())
    : ['MagicCheckout', 'Gokwik'];

  logger.info('Configuration built from comma-separated environment variables', {
    iterations,
    networkConditions,
    cpuConditions,
    products,
  });

  // Build the configuration
  const config: Config = {
    products: defaultConfig.products.map((product) => ({
      ...product,
      enabled: products.includes(product.name),
    })),
    execution_matrix: {
      network: {
        slow_4g: {
          ...defaultConfig.execution_matrix.network.slow_4g,
          enabled: networkConditions.includes('slow_4g'),
        },
        fast_4g: {
          ...defaultConfig.execution_matrix.network.fast_4g,
          enabled: networkConditions.includes('fast_4g'),
        },
        no_throttling: {
          ...defaultConfig.execution_matrix.network.no_throttling,
          enabled: networkConditions.includes('no_throttling'),
        },
      },
      cpu: {
        no_throttling: {
          ...defaultConfig.execution_matrix.cpu.no_throttling,
          enabled: cpuConditions.includes('no_throttling'),
        },
        '2x_slowdown': {
          ...defaultConfig.execution_matrix.cpu['2x_slowdown'],
          enabled: cpuConditions.includes('2x_slowdown'),
        },
        '4x_slowdown': {
          ...defaultConfig.execution_matrix.cpu['4x_slowdown'],
          enabled: cpuConditions.includes('4x_slowdown'),
        },
      },
      user_state: defaultConfig.execution_matrix.user_state,
    },
    execution: {
      ...defaultConfig.execution,
      iterations,
    },
    output: defaultConfig.output,
  };

  return config;
}

/**
 * Load and validate configuration with comprehensive error handling
 */
function loadConfig(): Config {
  const rawConfig = buildConfigFromCommaSeparatedEnvVars();

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
