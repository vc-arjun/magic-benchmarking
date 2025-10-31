import { CONFIG } from './config';
import { TestExecutor } from './executor';

const main = async () => {
  for (const product of CONFIG.products) {
    try {
      console.log(`Benchmarking performance of ${product.name}`);
      const testExecutor = new TestExecutor(product);
      await testExecutor.initialize();
      await testExecutor.run();
      await testExecutor.cleanup();
      console.log(`Completed benchmarking performance of ${product.name}`);
    } catch (error) {
      console.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }
};

main().catch(console.error);
