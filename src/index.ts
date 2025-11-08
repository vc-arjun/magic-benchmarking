import { CONFIG } from './config';
import { TestExecutor } from './executor';
import { ResultsManager } from './results-manager';
import { logger } from './utils';

const main = async () => {
  logger.info('Starting Performance Benchmarking');
  logger.info('='.repeat(60));

  // Log product configuration
  logger.info('\n📋 Product Configuration:');
  for (const product of CONFIG.products) {
    logger.info(`  ${product.name}: ${product.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  }
  logger.info('');

  const resultsManager = new ResultsManager(CONFIG);
  
  // Capture system information for baseline context
  logger.info('📊 Capturing system information...');
  await resultsManager.initializeSystemInfo();
  logger.info('✅ System information captured');

  for (const product of CONFIG.products) {
    try {
      if (!product.enabled) {
        logger.info(`Skipping ${product.name} as it is not enabled`);
        continue;
      }
      logger.info(`\nBenchmarking performance of ${product.name}`);
      const testExecutor = new TestExecutor(product);
      await testExecutor.run();

      // Collect performance results
      const productResults = testExecutor.getResults();
      resultsManager.addProductResults(productResults);

      // Collect network results
      const networkResults = testExecutor.getNetworkResults();
      resultsManager.addNetworkResults(networkResults);

      // Check for failures and log them
      if (testExecutor.hasFailures()) {
        const failures = testExecutor.getFailedIterations();
        logger.warn(`⚠️  Completed benchmarking with ${failures.length} failed iterations for ${product.name}`);
      } else {
        logger.info(`✅ Completed benchmarking performance of ${product.name} - all iterations successful`);
      }
    } catch (error) {
      logger.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }

  // Save all results (performance and network) using unified method
  await resultsManager.saveAllResults();

  logger.info('\n🎉 All performance benchmarking completed!');
};

main().catch((error) => logger.error('Main execution failed:', error));
