import { Config } from './types/config';

export const CONFIG: Config = {
  products: [
    {
      name: 'MagicCheckout',
      entry_url: 'https://vsmani.com/',
      pom_file: 'magic-checkout.ts',
      enabled: true,
    },
  ],
  execution_matrix: {
    network: {
      slow_4g: {
        download_throughput: 500000,
        upload_throughput: 500000,
        latency: 400,
      },
      fast_4g: {
        download_throughput: 4000000,
        upload_throughput: 3000000,
        latency: 20,
      },
      no_throttling: {
        download_throughput: 0,
        upload_throughput: 0,
        latency: 0,
      },
    },
    cpu: {
      no_throttling: {
        rate: 1,
      },
      '4x_slowdown': {
        rate: 4,
      },
      '6x_slowdown': {
        rate: 6,
      },
    },
    user_state: {
      returning_user: {
        is_logged_in: false,
      },
      new_user: {
        is_logged_in: true,
      },
    },
  },
  execution: {
    iterations:1,
    timeout: 60000,
    headless: false,
    browsers: ['chromium'],
  },
  output: {
    formats: ['csv'],
    directory: './results',
  },
};
