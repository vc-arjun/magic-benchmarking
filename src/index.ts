import { CONFIG } from './config';
import { TestExecutor } from './executor';

const main = async () => {
  console.log('Starting Magic Checkout Performance Benchmarking');
  console.log('='.repeat(60));

  for (const product of CONFIG.products) {
    try {
      console.log(`\nBenchmarking performance of ${product.name}`);
      const testExecutor = new TestExecutor(product);
      await testExecutor.run();

      // Save results before cleanup
      await testExecutor.saveResults();

      console.log(`Completed benchmarking performance of ${product.name}`);
    } catch (error) {
      console.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 All performance benchmarking completed!');
};

main().catch(console.error);
