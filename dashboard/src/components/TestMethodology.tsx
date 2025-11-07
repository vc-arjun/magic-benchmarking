import { BenchmarkResults, NetworkConfig, CPUConfig, UserStateConfig } from '@/types/reports';
import { Info, Globe, Cpu, Network, RotateCcw, Monitor, Clock } from 'lucide-react';
import React from 'react';

type Props = {
  data: BenchmarkResults;
};

export const TestMethodology: React.FC<Props> = ({ data }) => {
  // Get enabled products - fallback to product names from results if config not available
  const enabledProducts =
    data.products_config?.filter((p) => p.enabled) ||
    data.products.map((p) => ({
      name: p.product,
      entry_url: 'Configuration not available in this report',
      enabled: true,
      pom_file: '',
    }));

  // Get enabled network conditions
  const enabledNetworks = Object.entries(data.execution_matrix.network)
    .filter(([, config]) => config.enabled)
    .map(([name, config]) => ({ name, config }));

  // Get enabled CPU conditions
  const enabledCpus = Object.entries(data.execution_matrix.cpu)
    .filter(([, config]) => config.enabled)
    .map(([name, config]) => ({ name, config }));

  // Get enabled user states
  const enabledUserStates = Object.entries(data.execution_matrix.user_state)
    .filter(([, config]) => config.enabled)
    .map(([name, config]) => ({ name, config }));

  // Calculate actual iterations from the data
  // For newer reports, execution_config.iterations will be corrected by consolidation script
  // For older reports, we need to calculate from actual measurements
  const calculateActualIterations = () => {
    if (data.products.length === 0) return data.execution_config.iterations;

    // Get the first product's first context's first metric to count iterations
    const firstProduct = data.products[0];
    if (!firstProduct.results || firstProduct.results.length === 0)
      return data.execution_config.iterations;

    const firstContext = firstProduct.results[0];
    const firstMetric = Object.values(firstContext.metrics)[0];

    if (!firstMetric || !firstMetric.measurements) return data.execution_config.iterations;

    return firstMetric.measurements.length;
  };

  const actualIterationsPerContext = calculateActualIterations();

  // Calculate total tests run
  const totalTestsRun =
    enabledProducts.length *
    enabledNetworks.length *
    enabledCpus.length *
    enabledUserStates.length *
    actualIterationsPerContext;

  const formatNetworkCondition = (name: string, config: NetworkConfig) => {
    if (name === 'no_throttling') {
      return 'No Throttling (Full Speed)';
    }
    if (name === 'slow_4g') {
      return `Slow 4G (${config.download_throughput / 1000}kbps, ${config.latency}ms latency)`;
    }
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatCpuCondition = (name: string, config: CPUConfig) => {
    if (name === 'no_throttling') {
      return 'No Throttling (Full Speed)';
    }
    if (name.includes('slowdown')) {
      return `${config.rate}x CPU Slowdown`;
    }
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatUserState = (name: string, config: UserStateConfig) => {
    if (name === 'new_user') {
      return config.is_logged_in ? 'New User (Logged In)' : 'New User (Not Logged In)';
    }
    return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Test Methodology</h2>
          <p className="text-sm text-gray-600">How these performance metrics were calculated</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Tested */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Products Tested</h3>
          </div>
          <div className="space-y-2">
            {enabledProducts.map((product, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-gray-700">{product.name}</div>
                <div className="text-gray-500 text-xs break-all">{product.entry_url}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Execution */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <RotateCcw className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-800">Test Execution</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Iterations per test:</span>
              <span className="font-medium">{actualIterationsPerContext}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Browser:</span>
              <span className="font-medium">{data.execution_config.browsers.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timeout:</span>
              <span className="font-medium">{data.execution_config.timeout / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Retries:</span>
              <span className="font-medium">{data.execution_config.retry.max_attempts}</span>
            </div>
          </div>
        </div>

        {/* Network Conditions */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Network className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Network Conditions</h3>
          </div>
          <div className="space-y-1">
            {enabledNetworks.map(({ name, config }, index) => (
              <div key={index} className="text-sm text-gray-700">
                {formatNetworkCondition(name, config)}
              </div>
            ))}
          </div>
        </div>

        {/* CPU Conditions */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-gray-800">CPU Conditions</h3>
          </div>
          <div className="space-y-1">
            {enabledCpus.map(({ name, config }, index) => (
              <div key={index} className="text-sm text-gray-700">
                {formatCpuCondition(name, config)}
              </div>
            ))}
          </div>
        </div>

        {/* Viewport & Environment */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Monitor className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Environment</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Viewport:</span>
              <span className="font-medium">
                {data.execution_config.viewport.width} x {data.execution_config.viewport.height}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Headless:</span>
              <span className="font-medium">{data.execution_config.headless ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User States:</span>
              <span className="font-medium">
                {enabledUserStates
                  .map(({ name, config }) => formatUserState(name, config))
                  .join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Test Summary */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-gray-800">Test Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Products:</span>
              <span className="font-medium">{enabledProducts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Test Combinations:</span>
              <span className="font-medium">
                {enabledNetworks.length * enabledCpus.length * enabledUserStates.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tests:</span>
              <span className="font-medium">{totalTestsRun}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Metrics Tracked:</span>
              <span className="font-medium">{Object.keys(data.metrics_metadata).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Each metric represents the average of {actualIterationsPerContext}{' '}
          iteration
          {actualIterationsPerContext !== 1 ? 's' : ''}&nbsp;under the specified conditions. Tests
          are performed using automated browser testing with Playwright to ensure consistent and
          reproducible results.
        </p>
      </div>
    </div>
  );
};
