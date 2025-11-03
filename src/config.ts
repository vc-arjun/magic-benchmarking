import { Config } from './types/config';

export const CONFIG: Config = {
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
      },
      no_throttling: {
        download_throughput: 0, // 0Mbps 
        upload_throughput: 0, // 0Mbps  
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
    },
    user_state: {
      new_user: {
        is_logged_in: true,
      },
    },
  },
  execution: {
    iterations: 2,
    timeout: 120000, // 2 minutes for slow network conditions
    headless: false,
    browsers: ['chromium'],
  },
  output: {
    formats: ['json', 'csv'],
    directory: './results',
  },
};
