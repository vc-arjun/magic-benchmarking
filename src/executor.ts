import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { Config, ProductConfig } from './types/config';
import { POM } from './types/pom';
import { CONFIG } from './config';
import { PerformanceMonitor } from './performance';

export class TestExecutor {
  private product: ProductConfig;
  private config: Config;
  private performanceMonitor: PerformanceMonitor;

  constructor(product: ProductConfig) {
    this.product = product;
    this.config = CONFIG;
    this.performanceMonitor = new PerformanceMonitor();
  }

  async run(): Promise<void> {
    try {
      console.log(`Starting execution for ${this.product.name}`);
      for (let i = 0; i < this.config.execution.iterations + 1; i++) {
        if (i === 0) {
          console.log(`\n--- Starting warmup iteration ---`);
          await this.runIteration(true);
          console.log(`\n--- Warmup iteration completed successfully ---`);
        } else {
          console.log(`\n--- Starting iteration ${i} of ${this.config.execution.iterations} ---`);
          await this.runIteration();
          console.log(`\n--- Iteration ${i} completed successfully ---`);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      console.log(`\n🎉 Execution completed for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to execute for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Run a single iteration with fresh browser process
   */
  private async runIteration(skipMetrics: boolean = false): Promise<void> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    let pom: POM | null = null;

    try {
      browser = await chromium.launch({
        headless: this.config.execution.headless,
        timeout: this.config.execution.timeout,
      });

      context = await browser.newContext();
      page = await context.newPage();

      if (!this.performanceMonitor) {
        throw new Error('Performance monitor not initialized');
      }
      this.performanceMonitor.setPage(page);

      const pomModule = await import(`./pom/${this.product.pom_file}`);
      pom = new pomModule.default(page, this.product, this.performanceMonitor);

      // Initialize and run the test
      if (!pom) {
        throw new Error('Failed to create POM instance');
      }
      await pom.initialize();
      await this.performInitialLoadBenchmark(pom, skipMetrics);
    } finally {
      await page?.close();
      await context?.close();
      await browser?.close();
    }
  }

  private async performInitialLoadBenchmark(pom: POM, skipMetrics: boolean = false): Promise<void> {
    // Trigger checkout and capture performance metrics
    if (!this.performanceMonitor) {
      throw new Error('Performance monitor not initialized');
    }
    await pom.triggerCheckout(skipMetrics);
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
