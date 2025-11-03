import { CONFIG } from './config';
import { TestExecutor } from './executor';
import { ResultsManager } from './results-manager';
import { NetworkResults } from './types/network';

const main = async () => {
  console.log('Starting Performance Benchmarking');
  console.log('='.repeat(60));

  const resultsManager = new ResultsManager(CONFIG);
  const allNetworkResults: NetworkResults[] = [];

  for (const product of CONFIG.products) {
    try {
      console.log(`\nBenchmarking performance of ${product.name}`);
      const testExecutor = new TestExecutor(product);
      await testExecutor.run();

      // Collect performance results
      const productResults = testExecutor.getResults();
      resultsManager.addProductResults(productResults);

      // Collect network results
      const networkResults = testExecutor.getNetworkResults();
      allNetworkResults.push(networkResults);

      console.log(`Completed benchmarking performance of ${product.name}`);
    } catch (error) {
      console.error(`Failed to benchmark performance of ${product.name}: ${error}`);
      process.exit(1);
    }
  }

  // Save consolidated performance results
  await resultsManager.saveResults();

  // Save network analysis results
  await saveNetworkResults(allNetworkResults);

  console.log('\n🎉 All performance benchmarking completed!');
};

/**
 * Save network analysis results to separate JSON file
 */
async function saveNetworkResults(networkResults: NetworkResults[]): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `network-analysis-${timestamp}.json`;

  const resultsDir = 'results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filepath = path.join(resultsDir, filename);

  const consolidatedNetworkResults = {
    timestamp: new Date().toISOString(),
    monitoringPhase: 'popup_to_interactive',
    description: 'Network request analysis for Razorpay requests during MagicCheckout widget loading',
    products: networkResults,
  };

  fs.writeFileSync(filepath, JSON.stringify(consolidatedNetworkResults, null, 2));
  console.log(`🔍 Network analysis results saved to: ${filepath}`);
}

main().catch(console.error);
