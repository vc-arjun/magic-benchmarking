import { Page } from 'playwright';
import { InitialLoadMetrics, ExecutionContext, Measurement } from './types/metrics';

export class PerformanceMonitor {
  private page: Page | null = null;
  private currentExecutionContext: ExecutionContext | null = null;
  private currentIteration: number = 0;
  private measurements: Map<string, Measurement[]> = new Map();

  constructor() {}

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
    await this.page?.evaluate((name) => {
      performance.mark(name);
    }, markName);
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
      throw new Error('Execution context must be set before recording metrics');
    }

    const contextKey = this.getContextKey(this.currentExecutionContext);
    const measurement: Measurement = {
      iteration: this.currentIteration,
      value,
      unit,
    };

    const key = `${contextKey}:${metricName}`;
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    this.measurements.get(key)!.push(measurement);
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
   */
  public async waitForMainThreadIdle(timeout: number = 5000): Promise<void> {
    await this.page?.evaluate((timeoutMs) => {
      return new Promise<void>((resolve) => {
        let idleTimer: NodeJS.Timeout;
        let observer: PerformanceObserver;
        
        const resetIdleTimer = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            observer?.disconnect();
            resolve();
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
          resolve();
        }, timeoutMs);
      });
    }, timeout);
  }
}
