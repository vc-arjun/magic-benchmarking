import { BrowserContext, chromium, Page } from 'playwright';
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
  getRandomUserAgent,
  exponentialBackoffRetry
} from './utils';

export class TestExecutor {
  private product: ProductConfig;
  private config: Config;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;
  private failedIterations: Array<{combination: {network: string, cpu: string, user_state: string}, iteration: number, error: string}> = [];
  private executorLogger: ReturnType<typeof createLogger>;

  constructor(product: ProductConfig) {
    this.product = product;
    this.config = CONFIG;
    this.performanceMonitor = new PerformanceMonitor();
    this.networkMonitor = new NetworkMonitor();
    this.executorLogger = createLogger(`TestExecutor:${product.name}`);
  }

  @logPerformance
  async run(): Promise<void> {
    return ErrorHandler.withRetry(
      async () => {
        this.executorLogger.info('Starting execution', {
          product: this.product.name,
          iterations: this.config.execution.iterations,
        });
        
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
   * Run a single iteration with completely fresh browser process and profile
   */
  private async runIteration(
    combination: {network: string, cpu: string, user_state: string}, 
    iteration: number,
    skipMetrics: boolean = false
  ): Promise<void> {
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    let pom: POM | null = null;

    try {
      // Generate unique user data directory for complete isolation
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const tempDir = os.tmpdir();
      const userDataDir = path.join(tempDir, `magic-benchmark-${Date.now()}-${Math.random().toString(36).substring(7)}`);
      
      // Ensure temp directory exists
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      this.executorLogger.debug(`Creating fresh browser profile: ${userDataDir}`);

      // Get random user agent for this iteration
      const userAgent = getRandomUserAgent();
      this.executorLogger.debug(`Using user agent: ${userAgent.substring(0, 50)}...`);

      // Launch persistent context with completely fresh profile
      context = await chromium.launchPersistentContext(userDataDir, {
        headless: this.config.execution.headless,
        timeout: this.config.execution.timeout,
        userAgent,
        viewport: { width: 1920, height: 1080 },
        // Additional isolation settings
        ignoreHTTPSErrors: false,
        bypassCSP: false,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-dev-shm-usage',
          '--no-sandbox', // Note: Only for CI environments
        ],
      });

      // Get the first page from the persistent context
      const pages = context.pages();
      page = pages.length > 0 ? pages[0] : await context.newPage();

      // Additional data clearing - ensure completely clean state
      await this.clearAllBrowserData(page);

      // Cleanup temp directory after context closes
      const cleanupTempDir = async () => {
        try {
          // Wait a bit for any remaining processes to finish
          await delay(500);
          if (fs.existsSync(userDataDir)) {
            fs.rmSync(userDataDir, { recursive: true, force: true });
            this.executorLogger.debug(`Cleaned up temp directory: ${userDataDir}`);
          }
        } catch (error) {
          this.executorLogger.warn(`Failed to cleanup temp directory: ${error}`);
          // Try again with more aggressive cleanup
          try {
            await delay(1000);
            if (fs.existsSync(userDataDir)) {
              fs.rmSync(userDataDir, { recursive: true, force: true });
            }
          } catch (retryError) {
            this.executorLogger.warn(`Retry cleanup also failed: ${retryError}`);
          }
        }
      };

      // Store cleanup function for later use instead of adding multiple listeners
      (context as BrowserContext & { _cleanupTempDir?: () => Promise<void> })._cleanupTempDir = cleanupTempDir;
      
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

      // Import POM module - handle both development (.ts) and production (.js) environments
      let pomModule;
      try {
        // First try: development mode with .ts extension
        if (process.env.NODE_ENV !== 'production') {
          pomModule = await import(`./pom/${this.product.pom_file}.ts`);
        } else {
          // Production mode: use .js extension
          const pomFile = this.product.pom_file.endsWith('.ts') 
            ? this.product.pom_file.replace('.ts', '.js')
            : `${this.product.pom_file}.js`;
          pomModule = await import(`./pom/${pomFile}`);
        }
      } catch (error) {
        // Fallback: try the other extension
        try {
          if (process.env.NODE_ENV !== 'production') {
            // Try without .ts extension in development
            pomModule = await import(`./pom/${this.product.pom_file}`);
          } else {
            // Try .ts in production (shouldn't happen but just in case)
            pomModule = await import(`./pom/${this.product.pom_file}.ts`);
          }
        } catch (fallbackError) {
          throw new Error(`Could not import POM module: ${this.product.pom_file}. Tried both .ts and .js extensions. Original error: ${error}. Fallback error: ${fallbackError}`);
        }
      }
      
      pom = new pomModule.default(page, this.product, this.performanceMonitor, this.networkMonitor);

      // Initialize and run the test
      if (!pom) {
        throw new Error('Failed to create POM instance');
      }
      await pom.initialize();
      await this.performInitialLoadBenchmark(pom, skipMetrics);
    } finally {
      // Ensure complete cleanup
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
        if (context) {
          await context.close();
          
          // Run the stored cleanup function
          const cleanupTempDir = (context as BrowserContext & { _cleanupTempDir?: () => Promise<void> })._cleanupTempDir;
          if (cleanupTempDir) {
            await cleanupTempDir();
          }
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        this.executorLogger.debug(`Browser resources cleaned up for iteration ${iteration}`);
      } catch (error) {
        this.executorLogger.warn(`Error during browser cleanup: ${error}`);
      }
    }
  }

  /**
   * Clear all browser data to ensure completely fresh state
   */
  private async clearAllBrowserData(page: Page): Promise<void> {
    try {
      // Clear all storage using CDP
      const cdpSession = await page.context().newCDPSession(page);
      
      // Clear various storage types
      await Promise.all([
        // Clear cookies
        cdpSession.send('Network.clearBrowserCookies'),
        
        // Clear cache
        cdpSession.send('Network.clearBrowserCache'),
        
        // Clear storage (localStorage, sessionStorage, indexedDB, etc.)
        cdpSession.send('Storage.clearDataForOrigin', {
          origin: '*',
          storageTypes: 'all'
        }).catch(() => {
          // Fallback if Storage.clearDataForOrigin is not available
          return cdpSession.send('DOMStorage.clear');
        }),
        
        // Clear service workers
        cdpSession.send('ServiceWorker.unregister', {
          scopeURL: '*'
        }).catch(() => {
          // Service worker clearing might not be available in all contexts
        }),
      ]);

      // Additional JavaScript-based clearing
      await page.evaluate(() => {
        // Clear localStorage
        try {
          localStorage.clear();
        } catch {
          // localStorage might not be available
        }
        
        // Clear sessionStorage
        try {
          sessionStorage.clear();
        } catch {
          // sessionStorage might not be available
        }
        
        // Clear any cached data
        try {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
        } catch {
          // Cache API might not be available
        }
      });

      await cdpSession.detach();
      
      this.executorLogger.debug('Browser data cleared successfully');
    } catch (error) {
      this.executorLogger.warn(`Failed to clear browser data: ${error}`);
      // Don't throw error as this is not critical for test execution
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
