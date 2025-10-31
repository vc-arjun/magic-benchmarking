import { Page } from 'playwright';
import { POM } from '../types/pom';
import { ProductConfig } from '../types/config';
import { expect } from '@playwright/test';
import { PerformanceMonitor } from '../performance';
import { PERFORMANCE_MARKERS } from '../constants/performance';

class MagicCheckoutPOM implements POM {
  private page: Page;
  private productConfig: ProductConfig;
  private performanceMonitor: PerformanceMonitor;

  constructor(page: Page, productConfig: ProductConfig, performanceMonitor: PerformanceMonitor) {
    this.page = page;
    this.productConfig = productConfig;
    this.performanceMonitor = performanceMonitor;
  }

  public async initialize(): Promise<void> {
    try {
      console.log(`Initializing POM for ${this.productConfig.name}`);
      await this.page.goto(this.productConfig.entry_url);
      await this.page.waitForLoadState('domcontentloaded');
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
      const buyNowButton = experienceFrame.getByRole('button', { name: 'Buy Now' });

      // Ensure button is visible before starting measurement
      await expect(buyNowButton).toBeVisible();

      // Mark the start time just before clicking
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.TRIGGER_CHECKOUT_START);

      // Click the Buy Now button
      await buyNowButton.click();

      // Wait for the contact number input to be visible in the nested iframe
      const checkoutFrame = experienceFrame.locator('iframe[title="checkout"]').contentFrame();
      const contactNumberInput = checkoutFrame.getByTestId('contactNumber');

      await expect(contactNumberInput).toBeVisible();

      // Mark the end time when contact number input becomes visible
      await this.performanceMonitor.markEnd(
        PERFORMANCE_MARKERS.TRIGGER_CHECKOUT_END,
        PERFORMANCE_MARKERS.TRIGGER_CHECKOUT_START
      );

      // Calculate the duration
      const duration = await this.performanceMonitor.measureDuration(
        PERFORMANCE_MARKERS.TRIGGER_CHECKOUT_START,
        PERFORMANCE_MARKERS.TRIGGER_CHECKOUT_END
      );

      // Store the metric
      if (!skipMetrics) {
        this.performanceMonitor.setInitialLoadMetric('click_to_content', duration, 'ms');
      }

      console.log(`✅ Checkout triggered successfully for ${this.productConfig.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Failed to trigger checkout for ${this.productConfig.name}: ${errorMessage}`);

      throw error;
    }
  }
}

export default MagicCheckoutPOM;
