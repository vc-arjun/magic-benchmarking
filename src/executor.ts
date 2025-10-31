import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { Config, ProductConfig } from './types/config';
import { POM } from './types/pom';
import { CONFIG } from './config';

export class TestExecutor {
  private pom: POM | null = null;
  private product: ProductConfig;
  private page: Page | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Config;

  constructor(product: ProductConfig) {
    this.product = product;
    this.config = CONFIG;
  }

  async initialize(): Promise<void> {
    try {
      console.log(`Initializing executor for ${this.product.name}`);
      this.browser = await chromium.launch({
        headless: this.config.execution.headless,
        timeout: this.config.execution.timeout,
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      const pomModule = await import(`./pom/${this.product.pom_file}`);
      this.pom = new pomModule.default(this.page, this.product);
      console.log(`Executor initialized for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to initialize executor for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  async run(): Promise<void> {
    try {
      console.log(`Starting execution for ${this.product.name}`);
      for (let i = 0; i < this.config.execution.iterations; i++) {
        await this.runIteration(i + 1);
      }
      console.log(`Execution completed for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to execute for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  async runIteration(count: number): Promise<void> {
    try {
      console.log(`Running iteration ${count} for ${this.product.name}`);
      await this.pom?.initialize();
      await this.pom?.triggerCheckout();
    } catch (error) {
      console.log(`Failed to run iteration ${count} for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log(`Cleaning up executor for ${this.product.name}`);
      await this.page?.close();
      await this.pom?.cleanup();
      await this.context?.close();
      await this.browser?.close();
      console.log(`Executor cleaned up for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to cleanup executor for ${this.product.name}: ${error}`);
      throw error;
    }
  }
}
