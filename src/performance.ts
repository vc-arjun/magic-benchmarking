import { Page } from 'playwright';
import { InitialLoadMetrics, ExecutionContext, Measurement } from './types/metrics';
import { PerformanceError, createLogger, ErrorHandler } from './utils';

export class PerformanceMonitor {
  private page: Page | null = null;
  private currentExecutionContext: ExecutionContext | null = null;
  private currentIteration: number = 0;
  private measurements: Map<string, Measurement[]> = new Map();
  private performanceLogger: ReturnType<typeof createLogger>;

  constructor() {
    this.performanceLogger = createLogger('PerformanceMonitor');
  }

  /**
   * Update the page instance for fresh browser contexts
   */
  public setPage(page: Page): void {
    this.page = page;
  }

  /**
   * Mark the start of performance measurement
   */
  public async markStart(markName: string): Promise<void> {
    if (!this.page) {
      throw new PerformanceError('Page not set. Call setPage() before marking performance.');
    }

    return ErrorHandler.withRetry(
      async () => {
        await this.page!.evaluate((name) => {
          performance.mark(name);
        }, markName);
        this.performanceLogger.debug('Performance mark created', { markName });
      },
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          this.performanceLogger.warn(`Retry attempt ${attempt} for markStart`, { markName, error: error.message });
        },
      }
    );
  }

  /**
   * Mark a performance measurement at a specific timestamp
   */
  public async markAtTimestamp(markName: string, timestamp: number): Promise<void> {
    await this.page?.evaluate(({ name, time }) => {
      performance.mark(name, { startTime: time });
    }, { name: markName, time: timestamp });
  }

  /**
   * Mark the end of performance measurement and calculate duration
   */
  public async markEnd(markName: string, startMark: string): Promise<number> {
    const duration = await this.page?.evaluate(
      ({ endMark, startMark }) => {
        performance.mark(endMark);
        const measure = performance.measure(`${startMark}-to-${endMark}`, startMark, endMark);
        return measure.duration;
      },
      { endMark: markName, startMark }
    );

    return duration ?? 0;
  }

  /**
   * Measure time between two performance marks
   */
  public async measureDuration(startMark: string, endMark: string): Promise<number> {
    return (
      (await this.page?.evaluate(
        ({ name, start, end }) => {
          const measure = performance.measure(name, start, end);
          return measure.duration ?? 0;
        },
        { name: `${startMark}-to-${endMark}`, start: startMark, end: endMark }
      )) ?? 0
    );
  }

  /**
   * Set the current execution context and iteration
   */
  public setExecutionContext(context: ExecutionContext, iteration: number): void {
    this.currentExecutionContext = context;
    this.currentIteration = iteration;
  }

  /**
   * Record a metric measurement
   */
  public recordMetric(metricName: InitialLoadMetrics, value: number, unit: string): void {
    if (!this.currentExecutionContext) {
      throw new PerformanceError('Execution context must be set before recording metrics');
    }

    if (value < 0) {
      this.performanceLogger.warn('Negative metric value recorded', { metricName, value, unit });
    }

    const contextKey = this.getContextKey(this.currentExecutionContext);
    const measurement: Measurement = {
      iteration: this.currentIteration,
      value: Math.max(0, value), // Ensure non-negative values
      unit,
    };

    const key = `${contextKey}:${metricName}`;
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    this.measurements.get(key)!.push(measurement);

    this.performanceLogger.metric(metricName, measurement.value, unit, {
      iteration: this.currentIteration,
      context: this.currentExecutionContext,
    });
  }

  /**
   * Get all measurements organized by context
   */
  public getAllMeasurements(): Map<string, Measurement[]> {
    return this.measurements;
  }

  /**
   * Reset all measurements
   */
  public reset(): void {
    this.measurements.clear();
  }

  /**
   * Generate context key for grouping measurements
   */
  private getContextKey(context: ExecutionContext): string {
    return `${context.network}|${context.cpu}|${context.user_state}|${context.browser}`;
  }

  /**
   * Wait for the main thread to be idle (no long tasks for a specified duration)
   * Returns the timestamp when the main thread became idle
   */
  public async waitForMainThreadIdle(timeout: number = 5000): Promise<number> {
    const idleTimestamp = await this.page?.evaluate((timeoutMs) => {
      return new Promise<number>((resolve) => {
        let idleTimer: NodeJS.Timeout;
        let observer: PerformanceObserver;
        
        const resetIdleTimer = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            observer?.disconnect();
            // Return the timestamp when we determined the main thread is idle
            // This is approximately when the last long task ended + 100ms
            resolve(performance.now());
          }, 100); // Consider idle after 100ms of no long tasks
        };

        // Start the idle timer
        resetIdleTimer();

        // Observe long tasks
        if ('PerformanceObserver' in window) {
          observer = new PerformanceObserver(() => {
            resetIdleTimer();
          });
          observer.observe({ entryTypes: ['longtask'] });
        }

        // Fallback timeout
        setTimeout(() => {
          observer?.disconnect();
          clearTimeout(idleTimer);
          resolve(performance.now());
        }, timeoutMs);
      });
    }, timeout);

    return idleTimestamp ?? performance.now();
  }
}
