import React, { useState, useMemo } from 'react';
import { BenchmarkResults } from '@/types/reports';
import { FilterControls } from './performance-charts/FilterControls';
import { PerformanceLineChart } from './performance-charts/PerformanceLineChart';
import { PerformanceBarChart } from './performance-charts/PerformanceBarChart';
import { PerformanceSummary } from './performance-charts/PerformanceSummary';
import { ChartDataPoint, FilterState } from './performance-charts/types';
import { transformChartData } from './performance-charts/utils';

type Props = {
  data: BenchmarkResults;
};

export const PerformanceCharts: React.FC<Props> = ({ data }) => {
  const [filters, setFilters] = useState<FilterState>({
    selectedMetrics: Object.keys(data.metrics_metadata),
    selectedProducts: data.products.map((p) => p.product),
    selectedNetworks: Object.keys(data.execution_matrix.network),
    selectedCpus: Object.keys(data.execution_matrix.cpu),
    chartType: 'line',
  });

  // Transform data for visualization
  const chartData = useMemo(() => {
    const transformedData: Record<string, ChartDataPoint[]> = {};

    // Initialize arrays for each metric
    Object.keys(data.metrics_metadata).forEach((metricKey) => {
      transformedData[metricKey] = [];
    });

    // Process each product's results
    data.products.forEach((product) => {
      product.results.forEach((result) => {
        const contextKey = `${result.context.network}_${result.context.cpu}_${result.context.user_state}`;
        const contextLabel = `${result.context.network} | ${result.context.cpu} | ${result.context.user_state}`;

        Object.entries(result.metrics).forEach(([metricKey, metricData]) => {
          if (transformedData[metricKey]) {
            transformedData[metricKey].push({
              contextKey,
              contextLabel,
              product: product.product,
              network: result.context.network,
              cpu: result.context.cpu,
              userState: result.context.user_state,
              browser: result.context.browser,
              mean: metricData.statistics.mean,
              min: metricData.statistics.min,
              max: metricData.statistics.max,
              measurements: metricData.measurements.map((m) => m.value),
            });
          }
        });
      });
    });

    return transformedData;
  }, [data]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filtered: Record<string, ChartDataPoint[]> = {};

    filters.selectedMetrics.forEach((metric) => {
      if (chartData[metric]) {
        filtered[metric] = chartData[metric].filter(
          (point) =>
            filters.selectedProducts.includes(point.product) &&
            filters.selectedNetworks.includes(point.network) &&
            filters.selectedCpus.includes(point.cpu)
        );
      }
    });

    return filtered;
  }, [chartData, filters]);

  const totalMetrics = Object.keys(filteredData).length;
  const totalProducts = filters.selectedProducts.length;

  const renderChart = (metricKey: string, metricData: ChartDataPoint[]) => {
    if (metricData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            {data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata].name}
          </h3>
          <p className="text-gray-600 mb-4">
            {data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata].description}
          </p>
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="font-medium">No data available</p>
            <p className="text-sm mt-1">Adjust your filters to see results</p>
          </div>
        </div>
      );
    }

    const { groupedData, contextLegend } = transformChartData(metricData, data);
    const products = [...new Set(metricData.map((d) => d.product))];

    switch (filters.chartType) {
      case 'line':
        return (
          <PerformanceLineChart
            data={groupedData}
            products={products}
            contextLegend={contextLegend}
          />
        );
      case 'bar':
      default:
        return (
          <PerformanceBarChart
            data={groupedData}
            products={products}
            contextLegend={contextLegend}
          />
        );
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Filter Controls */}
      <FilterControls
        data={data}
        filters={filters}
        onFiltersChange={setFilters}
        totalMetrics={totalMetrics}
        totalProducts={totalProducts}
      />

      {/* Charts */}
      <div className="space-y-8">
        {filters.selectedMetrics.map((metricKey) => {
          const metricInfo = data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata];
          const metricData = filteredData[metricKey] || [];

          return (
            <div
              key={metricKey}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{metricInfo.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {metricData.length} {metricData.length === 1 ? 'data point' : 'data points'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {filters.selectedProducts.length}{' '}
                      {filters.selectedProducts.length === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{metricInfo.description}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">{renderChart(metricKey, metricData)}</div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <PerformanceSummary data={data} filteredData={filteredData} filters={filters} />
    </div>
  );
};
