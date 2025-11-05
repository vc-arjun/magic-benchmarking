import { CONFIG } from './config';
import { TestExecutor } from './executor';
import { ResultsManager } from './results-manager';

const main = async () => {
  console.log('Starting Performance Benchmarking');
  console.log('='.repeat(60));

  const resultsManager = new ResultsManager(CONFIG);

  for (const product of CONFIG.products) {
    try {
      if (!product.enabled) {
        console.log(`Skipping ${product.name} as it is not enabled`);
        continue;
      }
      console.log(`\nBenchmarking performance of ${product.name}`);
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
        console.log(`⚠️  Completed benchmarking with ${failures.length} failed iterations for ${product.name}`);
      } else {
        console.log(`✅ Completed benchmarking performance of ${product.name} - all iterations successful`);
      }
    } catch (error) {
      console.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }

  // Save all results (performance and network) using unified method
  await resultsManager.saveAllResults();

  console.log('\n🎉 All performance benchmarking completed!');
};

main().catch(console.error);
