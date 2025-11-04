import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { Config, ProductConfig } from './types/config';
import { POM } from './types/pom';
import { CONFIG } from './config';
import { PerformanceMonitor } from './performance';
import { NetworkMonitor } from './network-monitor';
import { ExecutionContext, ContextResults, Measurement, InitialLoadMetrics, ProductResults, MetricStatistics } from './types/metrics';
import { NetworkResults } from './types/network';

export class TestExecutor {
  private product: ProductConfig;
  private config: Config;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;
  private failedIterations: Array<{combination: {network: string, cpu: string, user_state: string}, iteration: number, error: string}> = [];

  constructor(product: ProductConfig) {
    this.product = product;
    this.config = CONFIG;
    this.performanceMonitor = new PerformanceMonitor();
    this.networkMonitor = new NetworkMonitor();
  }

  async run(): Promise<void> {
    try {
      console.log(`Starting execution for ${this.product.name}`);
      
      // Reset measurements for fresh run
      this.performanceMonitor.reset();
      
      // Get execution matrix combinations
      const executionCombinations = this.generateExecutionCombinations();
      
      for (const combination of executionCombinations) {
        console.log(`\n--- Testing combination: ${JSON.stringify(combination, null, 2)} ---`);
        
        // Warmup iteration with retry logic
        console.log(`\n--- Starting warmup iteration ---`);
        await this.runIterationWithRetry(combination, 0, true);
        console.log(`\n--- Warmup iteration completed successfully ---`);
        
        // Actual iterations with retry logic
        for (let i = 1; i <= this.config.execution.iterations; i++) {
          console.log(`\n--- Starting iteration ${i} of ${this.config.execution.iterations} ---`);
          await this.runIterationWithRetry(combination, i);
          console.log(`\n--- Iteration ${i} completed successfully ---`);
          
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      
      // Print execution summary
      this.printExecutionSummary();
      
      console.log(`\n🎉 Execution completed for ${this.product.name}`);
    } catch (error) {
      console.log(`Failed to execute for ${this.product.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Print a summary of the execution including failed iterations
   */
  private printExecutionSummary(): void {
    const executionCombinations = this.generateExecutionCombinations();
    const totalIterations = executionCombinations.length * this.config.execution.iterations;
    const failedCount = this.failedIterations.length;
    const successCount = totalIterations - failedCount;
    
    console.log(`\n📊 Execution Summary for ${this.product.name}:`);
    console.log(`   Total iterations: ${totalIterations}`);
    console.log(`   Successful: ${successCount} ✅`);
    console.log(`   Failed: ${failedCount} ❌`);
    
    if (failedCount > 0) {
      console.log(`\n❌ Failed iterations:`);
      for (const failure of this.failedIterations) {
        console.log(`   - Iteration ${failure.iteration} (${JSON.stringify(failure.combination)}): ${failure.error}`);
      }
      
      if (this.config.execution.retry.save_progress_on_failure) {
        console.log(`\n💾 Progress was saved for partial results during failures`);
      }
    }
  }

  /**
   * Generate all execution matrix combinations
   */
  private generateExecutionCombinations(): Array<{network: string, cpu: string, user_state: string}> {
    const combinations = [];
    
    for (const networkKey of Object.keys(this.config.execution_matrix.network)) {
      const networkConfig = this.config.execution_matrix.network[networkKey];
      if (!networkConfig.enabled) continue;
      
      for (const cpuKey of Object.keys(this.config.execution_matrix.cpu)) {
        const cpuConfig = this.config.execution_matrix.cpu[cpuKey];
        if (!cpuConfig.enabled) continue;
        
        for (const userStateKey of Object.keys(this.config.execution_matrix.user_state)) {
          const userStateConfig = this.config.execution_matrix.user_state[userStateKey];
          if (!userStateConfig.enabled) continue;
          
          combinations.push({
            network: networkKey,
            cpu: cpuKey,
            user_state: userStateKey,
          });
        }
      }
    }
    
    return combinations;
  }

  /**
   * Run a single iteration with retry logic
   */
  private async runIterationWithRetry(
    combination: {network: string, cpu: string, user_state: string}, 
    iteration: number,
    skipMetrics: boolean = false
  ): Promise<void> {
    const retryConfig = this.config.execution.retry;
    const maxAttempts = retryConfig.max_attempts;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt - 1}/${maxAttempts - 1} for iteration ${iteration}`);
          // Add delay between retries to allow system to stabilize
          await new Promise((resolve) => setTimeout(resolve, retryConfig.delay_between_retries));
        }
        
        await this.runIteration(combination, iteration, skipMetrics);
        
        if (attempt > 1) {
          console.log(`✅ Retry successful on attempt ${attempt - 1} for iteration ${iteration}`);
        }
        
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`❌ Attempt ${attempt} failed for iteration ${iteration}: ${lastError.message}`);
        
        if (attempt === maxAttempts) {
          console.log(`💥 All ${maxAttempts} attempts failed for iteration ${iteration}. Skipping this iteration.`);
          
          // Track failed iteration
          this.failedIterations.push({
            combination,
            iteration,
            error: lastError.message
          });
          
          // Save current progress if configured to do so
          if (retryConfig.save_progress_on_failure) {
            console.log(`📊 Saving current progress before continuing...`);
            await this.saveCurrentProgress();
          }
          
          // Log the final error but don't throw - continue with next iteration
          console.log(`⚠️  Final error for iteration ${iteration}: ${lastError.message}`);
          return;
        }
      }
    }
  }

  /**
   * Save current progress to avoid losing all data
   */
  private async saveCurrentProgress(): Promise<void> {
    try {
      const { ResultsManager } = await import('./results-manager');
      const resultsManager = new ResultsManager(this.config);
      
      // Get current results
      const productResults = this.getResults();
      const networkResults = this.getNetworkResults();
      
      // Only save if we have some results
      if (productResults.results.length > 0) {
        resultsManager.addProductResults(productResults);
        
        if (networkResults.results && networkResults.results.length > 0) {
          resultsManager.addNetworkResults(networkResults);
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await resultsManager.saveAllResults(
          `partial-progress-${this.product.name}-${timestamp}`,
          `partial-network-${this.product.name}-${timestamp}`
        );
        
        console.log(`💾 Progress saved successfully`);
      } else {
        console.log(`📝 No results to save yet`);
      }
    } catch (saveError) {
      console.log(`⚠️  Failed to save progress: ${saveError}`);
      // Don't throw here - we want to continue execution
    }
  }

  /**
   * Run a single iteration with fresh browser process
   */
  private async runIteration(
    combination: {network: string, cpu: string, user_state: string}, 
    iteration: number,
    skipMetrics: boolean = false
  ): Promise<void> {
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
      
      // Set page timeout to match our config, especially important for slow network conditions
      page.setDefaultTimeout(this.config.execution.timeout);
      page.setDefaultNavigationTimeout(this.config.execution.timeout);

      // Apply network throttling
      const networkConfig = this.config.execution_matrix.network[combination.network];
      if (networkConfig.download_throughput > 0) {
        await page.route('**/*', async (route) => {
          await route.continue();
        });
        
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: networkConfig.download_throughput,
          uploadThroughput: networkConfig.upload_throughput,
          latency: networkConfig.latency,
        });
      }

      // Apply CPU throttling
      const cpuConfig = this.config.execution_matrix.cpu[combination.cpu];
      if (cpuConfig.rate > 1) {
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Emulation.setCPUThrottlingRate', {
          rate: cpuConfig.rate,
        });
      }

      if (!this.performanceMonitor) {
        throw new Error('Performance monitor not initialized');
      }
      this.performanceMonitor.setPage(page);
      this.networkMonitor.setPage(page);

      // Set execution context for measurements
      if (!skipMetrics) {
        const executionContext: ExecutionContext = {
          network: combination.network,
          cpu: combination.cpu,
          user_state: combination.user_state,
          browser: 'chromium',
        };
        this.performanceMonitor.setExecutionContext(executionContext, iteration);
        this.networkMonitor.setExecutionContext(executionContext, iteration);
      }

      const pomModule = await import(`./pom/${this.product.pom_file}`);
      pom = new pomModule.default(page, this.product, this.performanceMonitor, this.networkMonitor);

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
   * Get performance results for this product
   */
  public getResults(): ProductResults {
    return this.buildProductResults();
  }

  /**
   * Get network monitoring results for this product
   */
  public getNetworkResults(): NetworkResults {
    return {
      product: this.product.name,
      timestamp: new Date().toISOString(),
      monitoring_phase: 'popup_to_interactive',
      results: this.networkMonitor.getNetworkResults(),
    };
  }

  /**
   * Get information about failed iterations
   */
  public getFailedIterations(): Array<{combination: {network: string, cpu: string, user_state: string}, iteration: number, error: string}> {
    return this.failedIterations;
  }

  /**
   * Check if there were any failed iterations
   */
  public hasFailures(): boolean {
    return this.failedIterations.length > 0;
  }

  /**
   * Build product results for this executor
   */
  private buildProductResults(): ProductResults {
    const measurements = this.performanceMonitor.getAllMeasurements();
    const contextResults: ContextResults[] = [];

    // Group measurements by context
    const contextGroups = new Map<string, Map<string, Measurement[]>>();
    
    for (const [key, measurementList] of measurements) {
      const [contextKey, metricName] = key.split(':');
      
      if (!contextGroups.has(contextKey)) {
        contextGroups.set(contextKey, new Map());
      }
      
      contextGroups.get(contextKey)!.set(metricName, measurementList);
    }

    // Build context results
    for (const [contextKey, metricGroups] of contextGroups) {
      const [network, cpu, user_state, browser] = contextKey.split('|');
      
      const context: ExecutionContext = {
        network,
        cpu,
        user_state,
        browser,
      };

      const metrics: Record<string, { measurements: Measurement[]; statistics: MetricStatistics }> = {};
      
      for (const [metricName, measurementList] of metricGroups) {
        const statistics = this.calculateStatistics(measurementList);
        metrics[metricName] = {
          measurements: measurementList,
          statistics,
        };
      }

      contextResults.push({
        context,
        metrics: metrics as Record<InitialLoadMetrics, { measurements: Measurement[]; statistics: MetricStatistics }>,
      });
    }

    return {
      product: this.product.name,
      results: contextResults,
    };
  }

  /**
   * Calculate statistics for a list of measurements
   */
  private calculateStatistics(measurements: Measurement[]): MetricStatistics {
    if (measurements.length === 0) {
      return { min: 0, max: 0, mean: 0, count: 0 };
    }

    const values = measurements.map(m => m.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      min,
      max,
      mean: Math.round(mean * 100) / 100, // Round to 2 decimal places
      count: measurements.length,
    };
  }

}
