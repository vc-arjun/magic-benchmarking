import React, { useState, useMemo } from 'react';
import { NetworkAnalysisReport, NetworkResults } from '@/types/reports';
import { NetworkFilterControls } from './network-charts/NetworkFilterControls';
import { NetworkWaterfallChart } from './network-charts/NetworkWaterfallChart';
import { NetworkSummary } from './network-charts/NetworkSummary';
import { NetworkChartDataPoint, NetworkFilterState } from './network-charts/types';
import { transformWaterfallData } from './network-charts/utils';

type Props = {
  data: NetworkAnalysisReport;
};

export const NetworkCharts: React.FC<Props> = ({ data }) => {
  // Handle the case where data might not have the expected structure
  const safeData = data || { products: [] };
  const firstProduct = safeData.products?.[0];
  const results = firstProduct?.results || [];

  // Early return if no data
  if (!firstProduct || results.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
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
          <p className="font-medium">No network analysis data available</p>
          <p className="text-sm mt-1">Please select a network analysis report</p>
        </div>
      </div>
    );
  }

  // Get available execution contexts
  const availableContexts = useMemo(() => {
    const contexts = [...new Set(results.map(result => 
      `${result.context.network}_${result.context.cpu}_${result.context.user_state}`
    ))];
    return contexts;
  }, [results]);

  const [filters, setFilters] = useState<NetworkFilterState>({
    selectedRequestTypes: [
      ...new Set(results.flatMap((result) => result.requests?.map((req) => req.type) || [])),
    ],
    selectedProducts: firstProduct ? [firstProduct.product] : [],
    selectedNetworks: [
      ...new Set(results.map((result) => result.context?.network).filter(Boolean)),
    ],
    selectedCpus: [...new Set(results.map((result) => result.context?.cpu).filter(Boolean))],
    selectedUserStates: [
      ...new Set(results.map((result) => result.context?.user_state).filter(Boolean)),
    ],
    selectedContext: availableContexts[0] || '', // Default to first available context
  });

  // Transform data for visualization
  const chartData = useMemo(() => {
    const transformedData: Record<string, NetworkChartDataPoint[]> = {};

    // Process each context's results
    results.forEach((result) => {
      const contextKey = `${result.context.network}_${result.context.cpu}_${result.context.user_state}`;
      const contextLabel = `${result.context.network} | ${result.context.cpu} | ${result.context.user_state}`;

      result.requests.forEach((request) => {
        const requestKey = request.url;

        if (!transformedData[requestKey]) {
          transformedData[requestKey] = [];
        }

        transformedData[requestKey].push({
          url: request.url,
          method: request.method,
          type: request.type,
          contextKey,
          contextLabel,
          product: firstProduct?.product || 'Unknown',
          network: result.context.network,
          cpu: result.context.cpu,
          userState: result.context.user_state,
          browser: result.context.browser,
          mean: request.statistics.mean,
          min: request.statistics.min,
          max: request.statistics.max,
          count: request.statistics.count,
          measurements: request.measurements,
        });
      });
    });

    return transformedData;
  }, [results, firstProduct]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filtered: Record<string, NetworkChartDataPoint[]> = {};

    Object.entries(chartData).forEach(([requestUrl, requestData]) => {
      const filteredRequestData = requestData.filter(
        (point) =>
          filters.selectedRequestTypes.includes(point.type) &&
          filters.selectedProducts.includes(point.product) &&
          filters.selectedNetworks.includes(point.network) &&
          filters.selectedCpus.includes(point.cpu) &&
          filters.selectedUserStates.includes(point.userState) &&
          (filters.selectedContext === '' || point.contextKey === filters.selectedContext)
      );

      if (filteredRequestData.length > 0) {
        filtered[requestUrl] = filteredRequestData;
      }
    });

    return filtered;
  }, [chartData, filters]);

  // Flatten filtered data for charts
  const flatFilteredData = useMemo(() => {
    return Object.values(filteredData).flat();
  }, [filteredData]);

  // Get available iterations for waterfall chart
  const availableIterations = useMemo(() => {
    const iterations = new Set<number>();
    flatFilteredData.forEach((request) => {
      request.measurements.forEach((measurement) => {
        iterations.add(measurement.iteration);
      });
    });
    return Array.from(iterations).sort((a, b) => a - b);
  }, [flatFilteredData]);

  // Transform data for waterfall chart
  const waterfallData = useMemo(() => {
    return transformWaterfallData(flatFilteredData, availableIterations[0] || 1);
  }, [flatFilteredData, availableIterations]);

  const totalRequests = Object.keys(filteredData).length;
  const totalProducts = filters.selectedProducts.length;


  const renderWaterfallSection = () => {
    if (flatFilteredData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
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
            <p className="font-medium">No network data available</p>
            <p className="text-sm mt-1">Adjust your filters to see results</p>
          </div>
        </div>
      );
    }

    return (
      <NetworkWaterfallChart
        data={waterfallData}
        availableIterations={availableIterations}
        requestData={flatFilteredData}
        selectedContext={filters.selectedContext}
      />
    );
  };


  return (
    <div className="w-full grid grid-cols-[1fr,4fr] h-full">
      {/* Filter Controls */}
      <NetworkFilterControls
        data={{ product: firstProduct?.product || 'Unknown', results } as NetworkResults}
        filters={filters}
        onFiltersChange={setFilters}
        totalRequests={totalRequests}
        totalProducts={totalProducts}
      />

      <div className="flex flex-col w-full gap-6 overflow-y-auto p-4 h-[calc(100vh-5.5rem)]">
        {/* Summary Statistics */}
        <NetworkSummary
          data={{ product: firstProduct?.product || 'Unknown', results } as NetworkResults}
          filteredData={filteredData}
          filters={filters}
        />

        {/* Waterfall Section - All Requests */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-800">
                Request Timeline - By Execution Context
              </h3>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {totalRequests} {totalRequests === 1 ? 'request type' : 'request types'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {flatFilteredData.length}{' '}
                  {flatFilteredData.length === 1 ? 'data point' : 'data points'}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Timeline visualization showing network requests for a selected execution context. Use
              the dropdown to switch between different network/CPU/user state combinations.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">{renderWaterfallSection()}</div>
        </div>
      </div>
    </div>
  );
};
