import { Browser, BrowserContext, chromium, Page, CDPSession } from 'playwright';
import { Config, ProductConfig } from './types/config';
import { POM } from './types/pom';
import { CONFIG } from './config';
import { PerformanceMonitor } from './performance';
import { NetworkMonitor } from './network-monitor';
import { ExecutionContext, ContextResults, Measurement, InitialLoadMetrics, ProductResults, MetricStatistics } from './types/metrics';
import { NetworkResults } from './types/network';
import { 
  ErrorHandler, 
  createLogger, 
  logPerformance,
  calculateStatistics,
  delay,
  generateIterationDelay,
  exponentialBackoffRetry
} from './utils';

export class TestExecutor {
  private product: ProductConfig;
  private config: Config;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;
  private failedIterations: Array<{combination: {network: string, cpu: string, user_state: string}, iteration: number, error: string}> = [];
  private executorLogger: ReturnType<typeof createLogger>;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(product: ProductConfig) {
    this.product = product;
    this.config = CONFIG;
    this.performanceMonitor = new PerformanceMonitor();
    this.networkMonitor = new NetworkMonitor();
    this.executorLogger = createLogger(`TestExecutor:${product.name}`);
  }

  /**
   * Initialize browser and context at the start of testing
   */
  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.executorLogger.debug('Creating browser instance');
      this.browser = await chromium.launch({
        headless: this.config.execution.headless,
        args: [
          // Disable Local Network Access permission popup
          '--disable-web-security',
          // Additional automation flags
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--disable-translate',
          '--disable-default-apps',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      });
    }

    if (!this.context) {
      this.executorLogger.debug('Creating browser context');
      this.context = await this.browser.newContext({
        viewport: { 
          width: this.config.execution.viewport.width, 
          height: this.config.execution.viewport.height 
        },
        // Grant all permissions to avoid popups
        permissions: ['camera', 'microphone', 'geolocation', 'notifications'],
        // Ignore HTTPS errors for local development
        ignoreHTTPSErrors: true,
        // Accept downloads automatically
        acceptDownloads: true,
      });
    }
  }

  /**
   * Cleanup browser and context resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
        this.executorLogger.debug('Context closed');
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.executorLogger.debug('Browser closed');
      }
    } catch (error) {
      this.executorLogger.warn(`Error during cleanup: ${error}`);
    }
  }

  @logPerformance
  async run(): Promise<void> {
    try {
      return await ErrorHandler.withRetry(
        async () => {
          this.executorLogger.info('Starting execution', {
            product: this.product.name,
            iterations: this.config.execution.iterations,
          });
          
          // Initialize browser once at the start
          await this.initializeBrowser();
          
          // Reset measurements for fresh run
          this.performanceMonitor.reset();
          this.networkMonitor.reset();
          
          // Get execution matrix combinations
          const executionCombinations = this.generateExecutionCombinations();
          this.executorLogger.info('Generated execution combinations', {
            combinationsCount: executionCombinations.length,
            combinations: executionCombinations,
          });
          
          for (const [index, combination] of executionCombinations.entries()) {
            this.executorLogger.info(`Testing combination ${index + 1}/${executionCombinations.length}`, {
              combination,
              progress: `${Math.round(((index) / executionCombinations.length) * 100)}%`,
            });
            
            // Warmup iteration with retry logic
            this.executorLogger.debug('Starting warmup iteration');
            await this.runIterationWithRetry(combination, 0, true);
            this.executorLogger.debug('Warmup iteration completed');
            
            // Actual iterations with retry logic
            for (let i = 1; i <= this.config.execution.iterations; i++) {
              this.executorLogger.debug(`Starting iteration ${i}/${this.config.execution.iterations}`);
              await this.runIterationWithRetry(combination, i);
              this.executorLogger.debug(`Iteration ${i} completed`);
              
              // Smart delay between iterations with jitter and extended delays
              const delayMs = generateIterationDelay(i);
              this.executorLogger.debug(`Waiting ${Math.round(delayMs / 1000)}s before next iteration`);
              await delay(delayMs);
            }
          }
          
          // Print execution summary
          this.printExecutionSummary();
          
          this.executorLogger.info('Execution completed successfully', {
            totalIterations: executionCombinations.length * this.config.execution.iterations,
            failedIterations: this.failedIterations.length,
          });
        },
        {
          maxAttempts: 1, // Don't retry the entire execution
          shouldRetry: () => false,
        }
      );
    } finally {
      // Always cleanup browser resources
      await this.cleanup();
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
   * Run a single iteration with enhanced retry logic using exponential backoff
   */
  private async runIterationWithRetry(
    combination: {network: string, cpu: string, user_state: string}, 
    iteration: number,
    skipMetrics: boolean = false
  ): Promise<void> {
    const retryConfig = this.config.execution.retry;
    
    try {
      await exponentialBackoffRetry(
        () => this.runIteration(combination, iteration, skipMetrics),
        {
          maxRetries: retryConfig.max_attempts - 1, // -1 because exponentialBackoffRetry includes initial attempt
          baseDelayMs: retryConfig.delay_between_retries,
          maxDelayMs: 30000, // Cap at 30 seconds
          jitterPercent: 25,
          shouldRetry: (error) => {
            // Don't retry on certain critical errors
            const criticalErrors = ['Page crashed', 'Browser closed', 'Context disposed'];
            const isCriticalError = criticalErrors.some(criticalError => 
              error.message.includes(criticalError)
            );
            
            if (isCriticalError) {
              this.executorLogger.warn(`Critical error detected, not retrying: ${error.message}`);
              return false;
            }
            
            return true;
          },
          onRetry: (attempt, error, delayMs) => {
            console.log(`🔄 Retry attempt ${attempt}/${retryConfig.max_attempts - 1} for iteration ${iteration} after ${Math.round(delayMs / 1000)}s`);
            this.executorLogger.warn(`Retry attempt ${attempt} for iteration ${iteration}`, {
              error: error.message,
              delayMs,
              combination
            });
          }
        }
      );
      
      this.executorLogger.debug(`Iteration ${iteration} completed successfully`);
    } catch (error) {
      const lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`💥 All retry attempts failed for iteration ${iteration}: ${lastError.message}`);
      
      // Track failed iteration
      this.failedIterations.push({
        combination,
        iteration,
        error: lastError.message
      });
      
      // Throw error to stop execution immediately
      throw new Error(`Benchmarking failed on iteration ${iteration} after ${retryConfig.max_attempts} attempts: ${lastError.message}`);
    }
  }


  /**
   * Run a single iteration with shared context, only creating new pages
   */
  private async runIteration(
    combination: {network: string, cpu: string, user_state: string}, 
    iteration: number,
    skipMetrics: boolean = false
  ): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    let page: Page | null = null;
    let cdpSession: CDPSession | null = null;

    try {
      // Create new page from shared context
      page = await this.context.newPage();

      // Create single CDP session for both network and CPU throttling
      const networkConfig = this.config.execution_matrix.network[combination.network];
      const cpuConfig = this.config.execution_matrix.cpu[combination.cpu];
      
      if (networkConfig.download_throughput > 0 || cpuConfig.rate > 1) {
        cdpSession = await this.context.newCDPSession(page);
        
        // Apply network throttling if needed
        if (networkConfig.download_throughput > 0) {
          await cdpSession.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: networkConfig.download_throughput,
            uploadThroughput: networkConfig.upload_throughput,
            latency: networkConfig.latency,
          });
        }

        // Apply CPU throttling if needed
        if (cpuConfig.rate > 1) {
          await cdpSession.send('Emulation.setCPUThrottlingRate', {
            rate: cpuConfig.rate,
          });
        }
      }

      // Set up monitors
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

      // Import and create POM
      const pomModule = await this.importPOMModule();
      const pom = new pomModule.default(page, this.product, this.performanceMonitor, this.networkMonitor);

      // Run the test
      await pom.initialize();
      await this.performInitialLoadBenchmark(pom, skipMetrics);
    } finally {
      // Proper cleanup - detach CDP session first, then close page
      try {
        if (cdpSession) {
          await cdpSession.detach();
        }
        if (page && !page.isClosed()) {
          await page.close();
        }
      } catch (error) {
        this.executorLogger.warn(`Error during cleanup: ${error}`);
      }
    }
  }

  /**
   * Import POM module with simplified logic
   */
  private async importPOMModule(): Promise<{ default: new (page: Page, product: ProductConfig, performanceMonitor: PerformanceMonitor, networkMonitor: NetworkMonitor) => POM }> {
    try {
      // First try: development mode with .ts extension
      if (process.env.NODE_ENV !== 'production') {
        return await import(`./pom/${this.product.pom_file}.ts`);
      } else {
        // Production mode: use .js extension
        const pomFile = this.product.pom_file.endsWith('.ts') 
          ? this.product.pom_file.replace('.ts', '.js')
          : `${this.product.pom_file}.js`;
        return await import(`./pom/${pomFile}`);
      }
    } catch (error) {
      // Fallback: try the other extension
      try {
        if (process.env.NODE_ENV !== 'production') {
          // Try without .ts extension in development
          return await import(`./pom/${this.product.pom_file}`);
        } else {
          // Try .ts in production (shouldn't happen but just in case)
          return await import(`./pom/${this.product.pom_file}.ts`);
        }
      } catch (fallbackError) {
        throw new Error(`Could not import POM module: ${this.product.pom_file}. Tried both .ts and .js extensions. Original error: ${error}. Fallback error: ${fallbackError}`);
      }
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
    const stats = calculateStatistics(values);

    return {
      min: stats.min,
      max: stats.max,
      mean: stats.mean,
      count: stats.count,
    };
  }

}
