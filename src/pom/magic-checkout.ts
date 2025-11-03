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

      // Mark the start time just before clicking (start of all measurements)
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CHECKOUT_START);

      // Click the Buy Now button
      await buyNowButton.click();

      // Wait for the checkout popup/iframe to appear and mark popup appearance
      const checkoutFrame = experienceFrame.locator('iframe[title="checkout"]').contentFrame();
      await expect(checkoutFrame.locator('body')).toBeVisible();
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.POPUP_APPEARS);

      // Wait for the contact number input to be visible and mark content appearance
      const contactNumberInput = checkoutFrame.getByTestId('contactNumber');
      await expect(contactNumberInput).toBeVisible();
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CONTENT_APPEARS);

      // Wait for main thread to be idle and mark idle state
      await this.performanceMonitor.waitForMainThreadIdle();
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.MAIN_THREAD_IDLE);

      // Calculate and store all metrics
      if (!skipMetrics) {
        // 1. click_to_popup: Click to popup appearance
        const clickToPopupDuration = await this.performanceMonitor.measureDuration(
          PERFORMANCE_MARKERS.CHECKOUT_START,
          PERFORMANCE_MARKERS.POPUP_APPEARS
        );
        this.performanceMonitor.setInitialLoadMetric('click_to_popup', clickToPopupDuration, 'ms');

        // 2. popup_to_content: Popup to content appearance
        const popupToContentDuration = await this.performanceMonitor.measureDuration(
          PERFORMANCE_MARKERS.POPUP_APPEARS,
          PERFORMANCE_MARKERS.CONTENT_APPEARS
        );
        this.performanceMonitor.setInitialLoadMetric(
          'popup_to_content',
          popupToContentDuration,
          'ms'
        );

        // 3. click_to_content: Click to content appearance (existing metric)
        const clickToContentDuration = await this.performanceMonitor.measureDuration(
          PERFORMANCE_MARKERS.CHECKOUT_START,
          PERFORMANCE_MARKERS.CONTENT_APPEARS
        );
        this.performanceMonitor.setInitialLoadMetric(
          'click_to_content',
          clickToContentDuration,
          'ms'
        );

        // 4. total_load_time: Click to main thread idle
        const totalLoadTimeDuration = await this.performanceMonitor.measureDuration(
          PERFORMANCE_MARKERS.CHECKOUT_START,
          PERFORMANCE_MARKERS.MAIN_THREAD_IDLE
        );
        this.performanceMonitor.setInitialLoadMetric(
          'total_load_time',
          totalLoadTimeDuration,
          'ms'
        );

        // 5. content_to_interactive: Content to main thread idle
        const contentToInteractiveDuration = await this.performanceMonitor.measureDuration(
          PERFORMANCE_MARKERS.CONTENT_APPEARS,
          PERFORMANCE_MARKERS.MAIN_THREAD_IDLE
        );
        this.performanceMonitor.setInitialLoadMetric(
          'content_to_interactive',
          contentToInteractiveDuration,
          'ms'
        );
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
