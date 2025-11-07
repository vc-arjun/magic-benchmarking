import { Page } from 'playwright';
import { POM } from '../types/pom';
import { ProductConfig } from '../types/config';
import { expect } from '@playwright/test';
import { PerformanceMonitor } from '../performance';
import { NetworkMonitor } from '../network-monitor';
import { PERFORMANCE_MARKERS } from '../constants/performance';

class MagicCheckoutPOM implements POM {
  private page: Page;
  private productConfig: ProductConfig;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;

  constructor(
    page: Page,
    productConfig: ProductConfig,
    performanceMonitor: PerformanceMonitor,
    networkMonitor: NetworkMonitor
  ) {
    this.page = page;
    this.productConfig = productConfig;
    this.performanceMonitor = performanceMonitor;
    this.networkMonitor = networkMonitor;
  }

  public async initialize(): Promise<void> {
    try {
      console.log(`Initializing POM for ${this.productConfig.name}`);
      await this.page.goto(this.productConfig.entry_url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      console.log(`POM initialized for ${this.productConfig.name}`);
    } catch (error) {
      console.log(`Failed to initialize POM for ${this.productConfig.name}: ${error}`);
      throw error;
    }
  }

  public async triggerCheckout(skipMetrics: boolean = false): Promise<void> {
    try {
      console.log(`Triggering checkout for ${this.productConfig.name}`);

      // Get the iframe and button references
      const experienceFrame = this.page
        .locator('iframe[title="Experience Checkout"]')
        .contentFrame();

      await expect(experienceFrame.locator('body')).toBeVisible({
        timeout: 60000,
      });

      const buyNowButton = experienceFrame.getByRole('button', { name: 'Buy Now' });

      // Ensure button is visible before starting measurement
      await expect(buyNowButton).toBeVisible({
        timeout: 60000,
      });

      // Mark the start time just before clicking (start of all measurements)
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CHECKOUT_START);

      // Click the Buy Now button
      await buyNowButton.click();

      // Wait for the checkout popup/iframe to appear and mark popup appearance
      const checkoutFrame = experienceFrame.locator('iframe[title="checkout"]').contentFrame();
      await expect(checkoutFrame.locator('body')).toBeVisible({
        timeout: 60000,
      });

      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.POPUP_APPEARS);

      // Start network monitoring from popup appearance
      if (!skipMetrics) {
        console.log('🔍 Starting network monitoring for Razorpay requests...');
        await this.networkMonitor.startMonitoring();
      }

      // Wait for the contact number input to be visible and mark content appearance
      const contactNumberInput = checkoutFrame.getByTestId('contactNumber');
      await expect(contactNumberInput).toBeVisible({
        timeout: 60000,
      });

      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CONTENT_APPEARS);

      // Wait for main thread to be idle and mark idle state at the correct timestamp
      const idleTimestamp = await this.performanceMonitor.waitForMainThreadIdle();
      await this.performanceMonitor.markAtTimestamp(
        PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
        idleTimestamp
      );

      // Stop network monitoring when main thread is idle
      if (!skipMetrics) {
        await this.networkMonitor.stopMonitoring();
        console.log('🔍 Network monitoring stopped - main thread is idle');
      }

      // Calculate and store all metrics
      if (!skipMetrics) {
        const metrics = [
          {
            name: 'click_to_popup' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.POPUP_APPEARS,
          },
          {
            name: 'popup_to_content' as const,
            start: PERFORMANCE_MARKERS.POPUP_APPEARS,
            end: PERFORMANCE_MARKERS.CONTENT_APPEARS,
          },
          {
            name: 'click_to_content' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.CONTENT_APPEARS,
          },
          {
            name: 'total_load_time' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
          },
          {
            name: 'content_to_interactive' as const,
            start: PERFORMANCE_MARKERS.CONTENT_APPEARS,
            end: PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
          },
        ];

        for (const metric of metrics) {
          const duration = await this.performanceMonitor.measureDuration(metric.start, metric.end);
          this.performanceMonitor.recordMetric(metric.name, duration, 'ms');
        }

        // Only for Magic Checkout
        await this.calculateTTIInternal();
      }

      console.log(`✅ Checkout triggered successfully for ${this.productConfig.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Failed to trigger checkout for ${this.productConfig.name}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * TTI = Base TTI + Serviceability Duration + Coupon Load Duration
   */
  private async calculateTTIInternal(): Promise<void> {
    try {
      console.log('🔍 Calculating TTI Internal metric...');

      // Wait a bit more to allow performance marks to be recorded
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Extract performance timeline from checkout iframe
      const timeline = await this.page.evaluate(() => {
        const marks: Record<string, number> = {};

        try {
          // Try to access the Experience Checkout iframe first
          const expFrame = document.querySelector(
            'iframe[title="Experience Checkout"]'
          ) as HTMLIFrameElement;
          if (expFrame && expFrame.contentDocument) {
            // Then look for the checkout iframe inside the experience iframe
            const checkoutFrame = expFrame.contentDocument.querySelector(
              'iframe[title="checkout"]'
            ) as HTMLIFrameElement;
            if (checkoutFrame && checkoutFrame.contentWindow) {
              const checkoutPerformance = checkoutFrame.contentWindow.performance;
              if (checkoutPerformance) {
                const entries = checkoutPerformance.getEntriesByType('mark');
                entries.forEach((entry) => {
                  marks[entry.name] = entry.startTime;
                });
              }
            }
          }
        } catch (error) {
          console.log('Error extracting performance marks:', error);
        }

        return marks;
      });

      const start = await this.performanceMonitor.getTimestamp(PERFORMANCE_MARKERS.CHECKOUT_START);
      const end = timeline['magic-coupon-load-end'];

      if (!start || !end) {
        console.log('Failed to calculate TTI Internal metric: No start/end timestamp found');
        return;
      }
      const ttiInternal = end - start;

      // Record the TTI Internal metric
      this.performanceMonitor.recordMetric('tti_internal', ttiInternal, 'ms');
    } catch (error) {
      console.log('⚠️ Error calculating TTI Internal metric:', error);
      // Record zero as fallback to avoid missing data
      this.performanceMonitor.recordMetric('tti_internal', 0, 'ms');
    }
  }
}

export default MagicCheckoutPOM;
