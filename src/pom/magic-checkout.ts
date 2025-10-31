import { Page } from 'playwright';
import { POM } from '../types/pom';
import { ProductConfig } from '../types/config';
import { expect } from '@playwright/test';

class MagicCheckoutPOM implements POM {
  page: Page;
  productConfig: ProductConfig;
  constructor(page: Page, productConfig: ProductConfig) {
    this.page = page;
    this.productConfig = productConfig;
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

  public async cleanup(): Promise<void> {
    try {
      console.log(`Cleaning up POM for ${this.productConfig.name}`);
      // TODO: Add any additional cleanup logic here
      console.log(`POM cleaned up for ${this.productConfig.name}`);
    } catch (error) {
      console.log(`Failed to cleanup POM for ${this.productConfig.name}: ${error}`);
      throw error;
    }
  }

  public async triggerCheckout(): Promise<void> {
    try {
      console.log(`Triggering checkout for ${this.productConfig.name}`);

      await this.page.locator('button:has-text("ADD TO CART")').first().click();
      await this.page.getByRole('button', { name: 'CHECK OUT' }).click();
      await this.page.getByRole('button', { name: 'CHECK OUT' }).click();
      await expect(this.page.getByRole('button', { name: 'Continue' })).toBeVisible({
        timeout: 10000,
      });
      console.log(`Checkout triggered for ${this.productConfig.name}`);
    } catch (error) {
      console.log(`Failed to trigger checkout for ${this.productConfig.name}: ${error}`);
      throw error;
    }
  }
}

export default MagicCheckoutPOM;
