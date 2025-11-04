import { Config } from './types/config';
import { ValidationUtils, ConfigurationError, logger } from './utils';

/**
 * Load and validate configuration with comprehensive error handling
 */
function loadConfig(): Config {
  const rawConfig: Config = {
  products: [
    {
      name: 'MagicCheckout',
      entry_url: 'https://razorpay.com/demopg3/',
      pom_file: 'magic-checkout.ts',
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
    headless: false,
    browsers: ['chromium'],
    retry: {
      max_attempts: 3, // Total attempts (1 initial + 2 retries)
      delay_between_retries: 3000, // 3 seconds delay between retries
      save_progress_on_failure: true, // Save progress when all retries fail
    },
  },
  output: {
    formats: ['json', 'csv'],
    directory: './dashboard/public/results',
  },
  };

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
