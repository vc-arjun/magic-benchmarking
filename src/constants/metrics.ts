import { InitialLoadMetrics, MetricMetadata } from '../types/metrics';

export const METRICS: {
  initial_load: Record<InitialLoadMetrics, MetricMetadata>;
} = {
  initial_load: {
    total_load_time: {
      name: 'Total Load Time',
      description:
        'The time from the user clicks the checkout button till the last long task completes and the main thread is idle (Checkout is loaded and interactive)',
    },
    click_to_popup: {
      name: 'Click to Popup',
      description:
        'The time from the user clicks the checkout button to the checkout popup appears',
    },
    popup_to_content: {
      name: 'Popup to Content',
      description:
        'The time from the checkout popup appears to the mobile number input field appears',
    },
    click_to_content: {
      name: 'Click to Content',
      description:
        'The time from the user clicks the checkout button to the mobile number input field appears on the popup',
    },

    content_to_interactive: {
      name: 'Content to Interactive',
      description:
        'The time from the mobile number input field appears on the popup till the main thread is idle',
    },
    tti_internal: {
      name: 'TTI',
      description:
        'The time from the user clicks the checkout button to the coupons are loaded and the checkout is interactive. (public-page-init to coupon-load-end)',
    },
  },
};
