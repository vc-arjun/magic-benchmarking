import { Page } from 'playwright';
import { InitialLoadMetrics, Metrics } from './types/metrics';

export class PerformanceMonitor {
  private page: Page | null = null;
  private metrics: Metrics | null = null;

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
   * Get all performance metrics
   */
  public getMetrics(): Metrics {
    if (!this.metrics) {
      throw new Error('Metrics not set');
    }
    return this.metrics;
  }

  /**
   * Set the main metric (Buy Now to Contact Number)
   */
  public setMetrics(updater: (metrics: Metrics | null) => Metrics | null): void {
    this.metrics = updater(this.metrics);
  }

  public setInitialLoadMetric(metricName: InitialLoadMetrics, value: number, unit: string): void {
    if (this.metrics) {
      if (this.metrics.initial_load[metricName]) {
        this.metrics.initial_load[metricName].push({ value, unit });
      } else {
        this.metrics.initial_load[metricName] = [{ value, unit }];
      }
    } else {
      this.metrics = {
        initial_load: {
          [metricName]: [{ value, unit }],
        },
      } as Metrics;
    }
  }
}
