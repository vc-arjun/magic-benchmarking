import { CONFIG } from './config';
import { TestExecutor } from './executor';
import { ResultsManager } from './results-manager';

const main = async () => {
  console.log('Starting Performance Benchmarking');
  console.log('='.repeat(60));

  const resultsManager = new ResultsManager(CONFIG);

  for (const product of CONFIG.products) {
    try {
      console.log(`\nBenchmarking performance of ${product.name}`);
      const testExecutor = new TestExecutor(product);
      await testExecutor.run();

      // Collect results
      const productResults = testExecutor.getResults();
      resultsManager.addProductResults(productResults);

      console.log(`Completed benchmarking performance of ${product.name}`);
    } catch (error) {
      console.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }

  // Save consolidated results
  await resultsManager.saveResults();

  console.log('\n🎉 All performance benchmarking completed!');
};

main().catch(console.error);
