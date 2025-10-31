import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { Config, ProductConfig } from './types/config';
import { POM } from './types/pom';
import { CONFIG } from './config';
import { PerformanceMonitor } from './performance';

export class TestExecutor {
  private pom: POM | null = null;
  private product: ProductConfig;
  private page: Page | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Config;
  private performanceMonitor: PerformanceMonitor | null = null;

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
      this.performanceMonitor = new PerformanceMonitor(this.page);
      const pomModule = await import(`./pom/${this.product.pom_file}`);
      this.pom = new pomModule.default(this.page, this.product, this.performanceMonitor);
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
        await this.pom?.initialize();
        await this.performInitialLoadBenchmark();
      }
      console.log(`Execution completed for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to execute for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  async performInitialLoadBenchmark(): Promise<void> {
    // Trigger checkout and capture performance metrics
    if (!this.performanceMonitor) {
      throw new Error('Performance monitor not initialized');
    }
    await this.pom?.triggerCheckout();
  }

  async cleanup(): Promise<void> {
    try {
      console.log(`\nCleaning up executor for ${this.product.name}`);
      await this.page?.close();
      await this.context?.close();
      await this.browser?.close();
      console.log(`Executor cleaned up for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to cleanup executor for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Save performance results to JSON file
   */
  public async saveResults(filename?: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `performance-results-${this.product.name}-${timestamp}.json`;
    const finalFilename = filename || defaultFilename;

    const resultsDir = 'results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filepath = path.join(resultsDir, finalFilename);

    const reportData = {
      product: this.product.name,
      timestamp: new Date().toISOString(),
      iterations: this.config.execution.iterations,
      results: this.performanceMonitor?.getMetrics(),
    };

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`Performance results saved to: ${filepath}`);
  }
}
