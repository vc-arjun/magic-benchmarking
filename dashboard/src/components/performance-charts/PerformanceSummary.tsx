import React from 'react';
import { BenchmarkResults } from '@/types/reports';
import { ChartDataPoint, FilterState } from './types';

interface Props {
  data: BenchmarkResults;
  filteredData: Record<string, ChartDataPoint[]>;
  filters: FilterState;
}

interface ProductMetricStats {
  mean: number;
  min: number;
  max: number;
  count: number;
}

interface ExecutionCombinationSummary {
  contextKey: string;
  contextLabel: string;
  network: string;
  cpu: string;
  userState: string;
  products: string[];
  metrics: Record<
    string,
    {
      overall: ProductMetricStats;
      byProduct: Record<string, ProductMetricStats>;
    }
  >;
}

export const PerformanceSummary: React.FC<Props> = ({ data, filteredData, filters }) => {
  // Group data by execution combination
  const executionCombinations = React.useMemo(() => {
    const combinations: Record<string, ExecutionCombinationSummary> = {};

    // Process each metric's data
    Object.entries(filteredData).forEach(([metricKey, metricData]) => {
      metricData.forEach((point) => {
        if (!combinations[point.contextKey]) {
          combinations[point.contextKey] = {
            contextKey: point.contextKey,
            contextLabel: point.contextLabel,
            network: point.network,
            cpu: point.cpu,
            userState: point.userState,
            products: [],
            metrics: {},
          };
        }

        const combo = combinations[point.contextKey];

        // Add product if not already included
        if (!combo.products.includes(point.product)) {
          combo.products.push(point.product);
        }

        // Initialize metric if not exists
        if (!combo.metrics[metricKey]) {
          combo.metrics[metricKey] = {
            overall: {
              mean: 0,
              min: Infinity,
              max: -Infinity,
              count: 0,
            },
            byProduct: {},
          };
        }

        const metric = combo.metrics[metricKey];

        // Initialize product-specific metric if not exists
        if (!metric.byProduct[point.product]) {
          metric.byProduct[point.product] = {
            mean: 0,
            min: Infinity,
            max: -Infinity,
            count: 0,
          };
        }

        // Update overall metric statistics
        const overall = metric.overall;
        overall.mean = (overall.mean * overall.count + point.mean) / (overall.count + 1);
        overall.min = Math.min(overall.min, point.min);
        overall.max = Math.max(overall.max, point.max);
        overall.count += 1;

        // Update product-specific metric statistics
        const productMetric = metric.byProduct[point.product];
        productMetric.mean =
          (productMetric.mean * productMetric.count + point.mean) / (productMetric.count + 1);
        productMetric.min = Math.min(productMetric.min, point.min);
        productMetric.max = Math.max(productMetric.max, point.max);
        productMetric.count += 1;
      });
    });

    return Object.values(combinations);
  }, [filteredData]);

  // Calculate overall statistics with product breakdown
  const overallStats = React.useMemo(() => {
    const stats: Record<
      string,
      {
        overall: { mean: number; min: number; max: number };
        byProduct: Record<string, { mean: number; min: number; max: number }>;
      }
    > = {};

    filters.selectedMetrics.forEach((metricKey) => {
      const metricData = filteredData[metricKey] || [];
      if (metricData.length > 0) {
        // Calculate overall stats
        const overall = {
          mean: metricData.reduce((sum, point) => sum + point.mean, 0) / metricData.length,
          min: Math.min(...metricData.map((point) => point.min)),
          max: Math.max(...metricData.map((point) => point.max)),
        };

        // Calculate per-product stats
        const byProduct: Record<string, { mean: number; min: number; max: number }> = {};
        const productGroups: Record<string, typeof metricData> = {};

        // Group data by product
        metricData.forEach((point) => {
          if (!productGroups[point.product]) {
            productGroups[point.product] = [];
          }
          productGroups[point.product].push(point);
        });

        // Calculate stats for each product
        Object.entries(productGroups).forEach(([product, productData]) => {
          byProduct[product] = {
            mean: productData.reduce((sum, point) => sum + point.mean, 0) / productData.length,
            min: Math.min(...productData.map((point) => point.min)),
            max: Math.max(...productData.map((point) => point.max)),
          };
        });

        stats[metricKey] = { overall, byProduct };
      }
    });

    return stats;
  }, [filteredData, filters.selectedMetrics]);

  if (Object.keys(filteredData).length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Overall Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">📊 Overall Performance Summary</h3>
          <div className="text-sm text-gray-600">Aggregated across all selected contexts</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filters.selectedMetrics.map((metricKey) => {
            const metricInfo =
              data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata];
            const stats = overallStats[metricKey];

            if (!stats) return null;

            const products = Object.keys(stats.byProduct);

            // Find best and worst performing products for highlighting
            let bestProduct = '';
            let worstProduct = '';
            let bestMean = Infinity;
            let worstMean = -Infinity;

            if (products.length > 1) {
              products.forEach((product) => {
                const productMean = stats.byProduct[product].mean;
                if (productMean < bestMean) {
                  bestMean = productMean;
                  bestProduct = product;
                }
                if (productMean > worstMean) {
                  worstMean = productMean;
                  worstProduct = product;
                }
              });
            }

            return (
              <div
                key={metricKey}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-800 mb-3 text-base">{metricInfo.name}</h4>

                {/* Product Comparison Table */}
                <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 font-medium text-gray-600 border-r border-gray-200">
                          Metric
                        </th>
                        {products.map((product) => {
                          const isBest = product === bestProduct && products.length > 1;
                          const isWorst =
                            product === worstProduct &&
                            products.length > 1 &&
                            bestProduct !== worstProduct;

                          return (
                            <th
                              key={product}
                              className={`text-center p-2 font-medium ${
                                isBest
                                  ? 'text-green-700 bg-green-50'
                                  : isWorst
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-gray-600'
                              } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span>{product}</span>
                                {isBest && <span className="text-green-600">🏆</span>}
                                {isWorst && <span className="text-red-600">⚠️</span>}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Average Row */}
                      <tr className="border-t border-gray-200">
                        <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                          Average
                        </td>
                        {products.map((product) => {
                          const productStats = stats.byProduct[product];
                          const isBest = product === bestProduct && products.length > 1;
                          const isWorst =
                            product === worstProduct &&
                            products.length > 1 &&
                            bestProduct !== worstProduct;

                          return (
                            <td
                              key={product}
                              className={`text-center p-2 font-semibold ${
                                isBest
                                  ? 'text-green-700 bg-green-50'
                                  : isWorst
                                    ? 'text-red-700 bg-red-50'
                                    : 'text-gray-900'
                              } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                            >
                              {productStats.mean.toFixed(2)} ms
                            </td>
                          );
                        })}
                      </tr>

                      {/* Range Row */}
                      <tr className="border-t border-gray-100">
                        <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                          Range
                        </td>
                        {products.map((product) => {
                          const productStats = stats.byProduct[product];
                          const isBest = product === bestProduct && products.length > 1;
                          const isWorst =
                            product === worstProduct &&
                            products.length > 1 &&
                            bestProduct !== worstProduct;

                          return (
                            <td
                              key={product}
                              className={`text-center p-2 text-gray-700 ${
                                isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                              } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                            >
                              {productStats.min.toFixed(1)} - {productStats.max.toFixed(1)} ms
                            </td>
                          );
                        })}
                      </tr>

                      {/* Variance Row */}
                      <tr className="border-t border-gray-100">
                        <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                          Variance
                        </td>
                        {products.map((product) => {
                          const productStats = stats.byProduct[product];
                          const variance =
                            ((productStats.max - productStats.min) / productStats.mean) * 100;
                          const isBest = product === bestProduct && products.length > 1;
                          const isWorst =
                            product === worstProduct &&
                            products.length > 1 &&
                            bestProduct !== worstProduct;

                          return (
                            <td
                              key={product}
                              className={`text-center p-2 text-gray-600 ${
                                isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                              } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                            >
                              {variance.toFixed(1)}%
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Execution Combination Summaries */}
      {executionCombinations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              🔍 Performance by Execution Context
            </h3>
            <div className="text-sm text-gray-600">
              {executionCombinations.length} execution combinations
            </div>
          </div>

          <div className="space-y-6">
            {executionCombinations.map((combination) => (
              <div
                key={combination.contextKey}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                {/* Context Header */}
                <div className="mb-4 pb-3 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      📡 {combination.network}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🖥️ {combination.cpu}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      👤 {combination.userState}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.selectedMetrics.map((metricKey) => {
                    const metricInfo =
                      data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata];
                    const metricStats = combination.metrics[metricKey];

                    if (!metricStats) return null;

                    const products = Object.keys(metricStats.byProduct);

                    // Find best and worst performing products for highlighting
                    let bestProduct = '';
                    let worstProduct = '';
                    let bestMean = Infinity;
                    let worstMean = -Infinity;

                    if (products.length > 1) {
                      products.forEach((product) => {
                        const productMean = metricStats.byProduct[product].mean;
                        if (productMean < bestMean) {
                          bestMean = productMean;
                          bestProduct = product;
                        }
                        if (productMean > worstMean) {
                          worstMean = productMean;
                          worstProduct = product;
                        }
                      });
                    }

                    return (
                      <div
                        key={metricKey}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-100"
                      >
                        <h5 className="font-medium text-gray-800 mb-3 text-sm">
                          {metricInfo.name}
                        </h5>

                        {/* Product Comparison Table */}
                        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="text-left p-2 font-medium text-gray-600 border-r border-gray-200">
                                  Metric
                                </th>
                                {products.map((product) => {
                                  const isBest = product === bestProduct && products.length > 1;
                                  const isWorst =
                                    product === worstProduct &&
                                    products.length > 1 &&
                                    bestProduct !== worstProduct;

                                  return (
                                    <th
                                      key={product}
                                      className={`text-center p-2 font-medium ${
                                        isBest
                                          ? 'text-green-700 bg-green-50'
                                          : isWorst
                                            ? 'text-red-700 bg-red-50'
                                            : 'text-gray-600'
                                      } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        <span>{product}</span>
                                        {isBest && <span className="text-green-600">🏆</span>}
                                        {isWorst && <span className="text-red-600">⚠️</span>}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {/* Average Row */}
                              <tr className="border-t border-gray-200">
                                <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                                  Average
                                </td>
                                {products.map((product) => {
                                  const productStats = metricStats.byProduct[product];
                                  const isBest = product === bestProduct && products.length > 1;
                                  const isWorst =
                                    product === worstProduct &&
                                    products.length > 1 &&
                                    bestProduct !== worstProduct;

                                  return (
                                    <td
                                      key={product}
                                      className={`text-center p-2 font-semibold ${
                                        isBest
                                          ? 'text-green-700 bg-green-50'
                                          : isWorst
                                            ? 'text-red-700 bg-red-50'
                                            : 'text-gray-900'
                                      } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                                    >
                                      {productStats.mean.toFixed(2)} ms
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* Range Row */}
                              <tr className="border-t border-gray-100">
                                <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                                  Range
                                </td>
                                {products.map((product) => {
                                  const productStats = metricStats.byProduct[product];
                                  const isBest = product === bestProduct && products.length > 1;
                                  const isWorst =
                                    product === worstProduct &&
                                    products.length > 1 &&
                                    bestProduct !== worstProduct;

                                  return (
                                    <td
                                      key={product}
                                      className={`text-center p-2 text-gray-700 ${
                                        isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                                      } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                                    >
                                      {productStats.min.toFixed(1)} - {productStats.max.toFixed(1)}{' '}
                                      ms
                                    </td>
                                  );
                                })}
                              </tr>

                              {/* Variance Row */}
                              <tr className="border-t border-gray-100">
                                <td className="p-2 font-medium text-gray-600 border-r border-gray-200">
                                  Variance
                                </td>
                                {products.map((product) => {
                                  const productStats = metricStats.byProduct[product];
                                  const variance =
                                    ((productStats.max - productStats.min) / productStats.mean) *
                                    100;
                                  const isBest = product === bestProduct && products.length > 1;
                                  const isWorst =
                                    product === worstProduct &&
                                    products.length > 1 &&
                                    bestProduct !== worstProduct;

                                  return (
                                    <td
                                      key={product}
                                      className={`text-center p-2 text-gray-600 ${
                                        isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                                      } ${products.indexOf(product) < products.length - 1 ? 'border-r border-gray-200' : ''}`}
                                    >
                                      {variance.toFixed(1)}%
                                    </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
