#!/usr/bin/env node

/**
 * Consolidate parallel job results into a single comprehensive report
 * Handles deduplication, statistics recalculation, and proper merging
 */

const fs = require('fs');
const path = require('path');

function calculateStatistics(measurements) {
  if (measurements.length === 0) {
    return { min: 0, max: 0, mean: 0, count: 0 };
  }

  const values = measurements.map((m) => m.value);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(mean * 100) / 100,
    count: values.length,
  };
}

function consolidatePerformanceResults(resultsDir) {
  console.log('🔄 Consolidating performance results...');

  // Find all performance result files
  const files = fs.readdirSync(resultsDir);
  const performanceFiles = files.filter(
    (f) =>
      f.includes('performance-results-consolidated') && f.endsWith('.json') && !f.includes('final') // Avoid processing already consolidated files
  );

  if (performanceFiles.length === 0) {
    console.log('⚠️  No performance result files found');
    return null;
  }

  console.log(`📁 Found ${performanceFiles.length} performance result files:`, performanceFiles);

  // Initialize consolidated structure
  const consolidated = {
    timestamp: new Date().toISOString(),
    execution_config: null,
    execution_matrix: null,
    products_config: null,
    metrics_metadata: null,
    products: [],
    consolidation_info: {
      total_jobs: performanceFiles.length,
      job_files: performanceFiles,
      consolidated_at: new Date().toISOString(),
    },
  };

  // Track all measurements by product and context for proper statistics calculation
  const measurementsByProductAndContext = new Map();

  // Process each job result file
  performanceFiles.forEach((file, index) => {
    console.log(`📊 Processing job ${index + 1}/${performanceFiles.length}: ${file}`);

    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));

    // Copy metadata from first file
    if (!consolidated.execution_config) {
      consolidated.execution_config = data.execution_config;
      consolidated.execution_matrix = data.execution_matrix;
      consolidated.products_config = data.products_config;
      consolidated.metrics_metadata = data.metrics_metadata;
    }

    // Process each product
    data.products.forEach((product) => {
      const productName = product.product;

      if (!measurementsByProductAndContext.has(productName)) {
        measurementsByProductAndContext.set(productName, new Map());
      }

      const productContexts = measurementsByProductAndContext.get(productName);

      product.results.forEach((contextResult) => {
        const contextKey = JSON.stringify(contextResult.context);

        if (!productContexts.has(contextKey)) {
          productContexts.set(contextKey, {
            context: contextResult.context,
            metrics: new Map(),
          });
        }

        const contextData = productContexts.get(contextKey);

        // Merge measurements for each metric
        Object.entries(contextResult.metrics).forEach(([metricName, metricData]) => {
          if (!contextData.metrics.has(metricName)) {
            contextData.metrics.set(metricName, []);
          }

          // Add all measurements from this job
          contextData.metrics.get(metricName).push(...metricData.measurements);
        });
      });
    });
  });

  // Build final consolidated structure
  const productMap = new Map();

  for (const [productName, productContexts] of measurementsByProductAndContext) {
    productMap.set(productName, {
      product: productName,
      results: [],
    });

    for (const [, contextData] of productContexts) {
      // Recalculate statistics with all measurements
      const metrics = {};
      for (const [metricName, measurements] of contextData.metrics) {
        // Sort measurements by iteration for consistency
        measurements.sort((a, b) => a.iteration - b.iteration);

        metrics[metricName] = {
          measurements: measurements,
          statistics: calculateStatistics(measurements),
        };
      }

      productMap.get(productName).results.push({
        context: contextData.context,
        metrics: metrics,
      });
    }
  }

  consolidated.products = Array.from(productMap.values());

  // Calculate and store actual total iterations per context
  // This helps the dashboard show correct iteration counts
  if (consolidated.products.length > 0) {
    const firstProduct = consolidated.products[0];
    if (firstProduct.results && firstProduct.results.length > 0) {
      const firstContext = firstProduct.results[0];
      const firstMetric = Object.values(firstContext.metrics)[0];
      if (firstMetric && firstMetric.measurements) {
        const actualIterationsPerContext = firstMetric.measurements.length;
        
        // Update execution_config with actual total iterations
        if (consolidated.execution_config) {
          consolidated.execution_config.actual_iterations_per_context = actualIterationsPerContext;
          consolidated.execution_config.original_per_job_iterations = consolidated.execution_config.iterations;
          consolidated.execution_config.iterations = actualIterationsPerContext;
        }
        
        console.log(`📊 Calculated actual iterations per context: ${actualIterationsPerContext}`);
      }
    }
  }

  // Generate final filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = `performance-results-consolidated-final-${timestamp}.json`;
  const finalPath = path.join(resultsDir, finalFilename);

  // Save consolidated results
  fs.writeFileSync(finalPath, JSON.stringify(consolidated, null, 2));

  console.log(`✅ Consolidated performance results saved: ${finalFilename}`);
  console.log(
    `🛍️ Products consolidated: ${consolidated.products.length} (${consolidated.products.map((p) => p.product).join(', ')})`
  );
  console.log(
    `📈 Total measurements consolidated: ${consolidated.products.reduce((total, product) => {
      return (
        total +
        product.results.reduce((productTotal, result) => {
          return (
            productTotal +
            Object.values(result.metrics).reduce((metricTotal, metric) => {
              return metricTotal + metric.measurements.length;
            }, 0)
          );
        }, 0)
      );
    }, 0)}`
  );

  return finalFilename;
}

function consolidateNetworkResults(resultsDir) {
  console.log('🔄 Consolidating network results...');

  const files = fs.readdirSync(resultsDir);
  const networkFiles = files.filter(
    (f) => f.includes('network-analysis') && f.endsWith('.json') && !f.includes('final')
  );

  if (networkFiles.length === 0) {
    console.log('⚠️  No network result files found');
    return null;
  }

  console.log(`📁 Found ${networkFiles.length} network result files:`, networkFiles);

  const networkConsolidated = {
    timestamp: new Date().toISOString(),
    monitoring_phase: 'popup_to_interactive',
    description:
      'Network request analysis for Razorpay requests during MagicCheckout widget loading',
    products: [],
    consolidation_info: {
      total_jobs: networkFiles.length,
      job_files: networkFiles,
      consolidated_at: new Date().toISOString(),
    },
  };

  // Merge all network results
  networkFiles.forEach((file, index) => {
    console.log(`🌐 Processing network job ${index + 1}/${networkFiles.length}: ${file}`);

    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    networkConsolidated.products.push(...data.products);
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const finalFilename = `network-analysis-final-${timestamp}.json`;
  const finalPath = path.join(resultsDir, finalFilename);

  fs.writeFileSync(finalPath, JSON.stringify(networkConsolidated, null, 2));

  console.log(`✅ Consolidated network results saved: ${finalFilename}`);
  console.log(`🌐 Total network products consolidated: ${networkConsolidated.products.length}`);

  return finalFilename;
}

function generateCSVFromConsolidated(resultsDir, performanceFile) {
  if (!performanceFile) return null;

  console.log('📊 Generating consolidated CSV...');

  const data = JSON.parse(fs.readFileSync(path.join(resultsDir, performanceFile), 'utf8'));

  const rows = [];

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
    'Count',
  ];
  rows.push(headers.join(','));

  // Data rows
  data.products.forEach((productResult) => {
    productResult.results.forEach((contextResult) => {
      const { context } = contextResult;

      Object.entries(contextResult.metrics).forEach(([metricKey, metricData]) => {
        const metadata = data.metrics_metadata[metricKey];
        const { measurements, statistics } = metricData;

        // Create iterations string with all values
        const iterationsValues = measurements
          .sort((a, b) => a.iteration - b.iteration)
          .map((m) => (Math.round(m.value * 100) / 100).toString())
          .join('; ');

        const row = [
          escapeCSV(productResult.product),
          escapeCSV(context.network),
          escapeCSV(context.cpu),
          escapeCSV(context.user_state),
          escapeCSV(context.browser),
          escapeCSV(metadata.name),
          escapeCSV(metadata.description),
          escapeCSV(iterationsValues),
          escapeCSV(measurements[0]?.unit || 'ms'),
          (Math.round(statistics.min * 100) / 100).toString(),
          (Math.round(statistics.max * 100) / 100).toString(),
          (Math.round(statistics.mean * 100) / 100).toString(),
          statistics.count.toString(),
        ];
        rows.push(row.join(','));
      });
    });
  });

  const csvContent = rows.join('\n');
  const csvFilename = performanceFile.replace('.json', '.csv');
  const csvPath = path.join(resultsDir, csvFilename);

  fs.writeFileSync(csvPath, csvContent);
  console.log(`✅ Consolidated CSV saved: ${csvFilename}`);

  return csvFilename;
}

function escapeCSV(value) {
  if (typeof value !== 'string') value = String(value);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Main execution
function main() {
  const resultsDir = process.argv[2] || './temp-results';

  if (!fs.existsSync(resultsDir)) {
    console.error(`❌ Results directory not found: ${resultsDir}`);
    process.exit(1);
  }

  console.log(`🚀 Starting consolidation process for: ${resultsDir}`);
  console.log('='.repeat(60));

  try {
    // Consolidate performance results
    const performanceFile = consolidatePerformanceResults(resultsDir);

    // Consolidate network results
    const networkFile = consolidateNetworkResults(resultsDir);

    // Generate CSV from consolidated performance data
    const csvFile = generateCSVFromConsolidated(resultsDir, performanceFile);

    console.log('='.repeat(60));
    console.log('🎉 Consolidation completed successfully!');
    console.log('📁 Generated files:');
    if (performanceFile) console.log(`   📊 Performance: ${performanceFile}`);
    if (networkFile) console.log(`   🌐 Network: ${networkFile}`);
    if (csvFile) console.log(`   📋 CSV: ${csvFile}`);

    // Create summary for CI
    const summary = {
      success: true,
      files: {
        performance: performanceFile,
        network: networkFile,
        csv: csvFile,
      },
      consolidation_timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(resultsDir, 'consolidation-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📋 Consolidation summary saved');
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  }
}

// Run main function if this is the entry point
if (require.main === module) {
  main();
}

module.exports = {
  consolidatePerformanceResults,
  consolidateNetworkResults,
  generateCSVFromConsolidated,
};
