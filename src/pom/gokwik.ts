import { Page } from 'playwright';
import { POM } from '../types/pom';
import { ProductConfig } from '../types/config';
import { expect } from '@playwright/test';
import { PerformanceMonitor } from '../performance';
import { NetworkMonitor } from '../network-monitor';
import { PERFORMANCE_MARKERS } from '../constants/performance';
import { logger } from '../utils';

class GokwikPOM implements POM {
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
      logger.info(`Initializing POM for ${this.productConfig.name}`);
      await this.page.goto(this.productConfig.entry_url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      logger.info(`POM initialized for ${this.productConfig.name}`);
    } catch (error) {
      logger.error(`Failed to initialize POM for ${this.productConfig.name}: ${error}`);
      throw error;
    }
  }

  public async triggerCheckout(skipMetrics: boolean = false): Promise<void> {
    try {
      logger.info(`Triggering checkout for ${this.productConfig.name}`);

      await this.page.getByRole('button', { name: 'Add to Cart' }).first().click({
        timeout: 60000,
      });
      await this.page.getByText('6', { exact: true }).first().click({
        timeout: 60000,
      });

      await this.page.waitForTimeout(1000);

      const buyNowButton = this.page.getByRole('button', { name: 'Proceed To Checkout' }).first();

      // Ensure button is visible before starting measurement
      await expect(buyNowButton).toBeVisible({
        timeout: 60000,
      });

      // Mark the start time just before clicking (start of all measurements)
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CHECKOUT_START);

      // Click the Buy Now button
      await buyNowButton.click();

      // Wait for the checkout popup/iframe to appear and mark popup appearance
      const checkoutFrame = this.page.locator('iframe[title="Checkout window"]').contentFrame();
      await expect(checkoutFrame.locator('body')).toBeVisible({
        timeout: 60000,
      });
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.POPUP_APPEARS);

      // Start network monitoring from popup appearance
      if (!skipMetrics) {
        logger.info('🔍 Starting network monitoring for Razorpay requests...');
        await this.networkMonitor.startMonitoring();
      }

      // Wait for the contact number input to be visible and mark content appearance
      const contactNumberInput = checkoutFrame.getByRole('textbox', {
        name: 'Enter Mobile Number',
      });
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
        logger.info('🔍 Network monitoring stopped - main thread is idle');
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
      }

      logger.info(`✅ Checkout triggered successfully for ${this.productConfig.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to trigger checkout for ${this.productConfig.name}: ${errorMessage}`);

      throw error;
    }
  }
}

export default GokwikPOM;
