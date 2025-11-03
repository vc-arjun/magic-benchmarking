import { BenchmarkResults, ProductResults, MetricMetadata, InitialLoadMetrics } from './types/metrics';
import { Config } from './types/config';
import { METRICS } from './constants/metrics';

export class ResultsManager {
  private config: Config;
  private productResults: ProductResults[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Add results from a product
   */
  public addProductResults(productResults: ProductResults): void {
    this.productResults.push(productResults);
  }

  /**
   * Save consolidated results to JSON and CSV files
   */
  public async saveResults(filename?: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = filename ? filename.replace(/\.[^/.]+$/, '') : `performance-results-consolidated-${timestamp}`;

    const resultsDir = 'results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const results = this.buildConsolidatedResults();

    // Save JSON file
    const jsonFilepath = path.join(resultsDir, `${baseFilename}.json`);
    fs.writeFileSync(jsonFilepath, JSON.stringify(results, null, 2));
    console.log(`Consolidated performance results saved to: ${jsonFilepath}`);

    // Save CSV file
    const csvFilepath = path.join(resultsDir, `${baseFilename}.csv`);
    const csvContent = this.buildCSV(results);
    fs.writeFileSync(csvFilepath, csvContent);
    console.log(`Consolidated performance results saved to: ${csvFilepath}`);
  }

  /**
   * Build consolidated results structure
   */
  private buildConsolidatedResults(): BenchmarkResults {
    // Build metrics metadata once
    const metricsMetadata: Record<InitialLoadMetrics, MetricMetadata> = {} as Record<InitialLoadMetrics, MetricMetadata>;
    for (const metricName of Object.keys(METRICS.initial_load) as InitialLoadMetrics[]) {
      const metricInfo = METRICS.initial_load[metricName];
      metricsMetadata[metricName] = {
        name: metricInfo.name,
        description: metricInfo.description,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      execution_config: {
        iterations: this.config.execution.iterations,
        browsers: this.config.execution.browsers,
        timeout: this.config.execution.timeout,
        headless: this.config.execution.headless,
      },
      execution_matrix: this.config.execution_matrix,
      metrics_metadata: metricsMetadata,
      products: this.productResults,
    };
  }

  /**
   * Build CSV content from consolidated results
   */
  private buildCSV(results: BenchmarkResults): string {
    const rows: string[] = [];
    
    // CSV Header
    const headers = [
      'Product',
      'Network',
      'CPU',
      'User State', 
      'Browser',
      'Metric Name',
      'Metric Description',
      'Iterations',
      'Unit',
      'Min',
      'Max',
      'Mean',
      'Count'
    ];
    rows.push(headers.join(','));

    // Data rows
    for (const productResult of results.products) {
      for (const contextResult of productResult.results) {
        const { context } = contextResult;
        
        for (const [metricKey, metricData] of Object.entries(contextResult.metrics)) {
          const metricName = metricKey as InitialLoadMetrics;
          const metadata = results.metrics_metadata[metricName];
          const { measurements, statistics } = metricData;
          
          // Create iterations string with all values rounded to 2 decimal places
          const iterationsValues = measurements
            .sort((a, b) => a.iteration - b.iteration) // Sort by iteration number
            .map(m => (Math.round(m.value * 100) / 100).toString())
            .join('; '); // Use semicolon separator for clarity
          
          const row = [
            this.escapeCSV(productResult.product),
            this.escapeCSV(context.network),
            this.escapeCSV(context.cpu),
            this.escapeCSV(context.user_state),
            this.escapeCSV(context.browser),
            this.escapeCSV(metadata.name),
            this.escapeCSV(metadata.description),
            this.escapeCSV(iterationsValues),
            this.escapeCSV(measurements[0]?.unit || 'ms'),
            (Math.round(statistics.min * 100) / 100).toString(),
            (Math.round(statistics.max * 100) / 100).toString(),
            (Math.round(statistics.mean * 100) / 100).toString(),
            statistics.count.toString()
          ];
          rows.push(row.join(','));
        }
      }
    }

    return rows.join('\n');
  }

  /**
   * Escape CSV values (handle commas, quotes, newlines)
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
