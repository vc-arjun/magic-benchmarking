/**
 * Optimized chart data processing hook with memoization and performance improvements
 */

import { useMemo, useState } from 'react';
import { BenchmarkResults, NetworkAnalysisReport } from '@/types/reports';

/**
 * Chart data cache
 */
const chartDataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Create cache key from inputs
 */
function createCacheKey(prefix: string, ...inputs: unknown[]): string {
  return `${prefix}_${JSON.stringify(inputs)}`;
}

/**
 * Performance chart data processing
 */
export interface ChartDataPoint {
  contextKey: string;
  contextLabel: string;
  product: string;
  network: string;
  cpu: string;
  userState: string;
  browser: string;
  mean: number;
  min: number;
  max: number;
  measurements: number[];
}

export interface FilterState {
  selectedMetrics: string[];
  selectedProducts: string[];
  selectedNetworks: string[];
  selectedCpus: string[];
  selectedUserStates: string[];
  chartType: 'line' | 'bar';
}

/**
 * Hook for processing performance chart data with caching
 */
export const usePerformanceChartData = (data: BenchmarkResults | null, filters: FilterState) => {
  const [processingTime, setProcessingTime] = useState(0);

  /**
   * Transform raw data to chart format with caching
   */
  const chartData = useMemo(() => {
    if (!data) return {};

    const startTime = performance.now();
    const cacheKey = createCacheKey('perf_chart', data.timestamp, filters);

    // Check cache
    const cached = chartDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProcessingTime(performance.now() - startTime);
      return cached.data as Record<string, ChartDataPoint[]>;
    }

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

    // Cache the result
    chartDataCache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now(),
    });

    const endTime = performance.now();
    setProcessingTime(endTime - startTime);

    return transformedData;
  }, [data, filters]);

  /**
   * Filter data based on current filters with memoization
   */
  const filteredData = useMemo(() => {
    const cacheKey = createCacheKey('perf_filtered', chartData, filters);

    // Check cache
    const cached = chartDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as Record<string, ChartDataPoint[]>;
    }

    const filtered: Record<string, ChartDataPoint[]> = {};

    filters.selectedMetrics.forEach((metric) => {
      if (chartData[metric]) {
        filtered[metric] = chartData[metric].filter(
          (point) =>
            filters.selectedProducts.includes(point.product) &&
            filters.selectedNetworks.includes(point.network) &&
            filters.selectedCpus.includes(point.cpu) &&
            filters.selectedUserStates.includes(point.userState)
        );
      }
    });

    // Cache the result
    chartDataCache.set(cacheKey, {
      data: filtered,
      timestamp: Date.now(),
    });

    return filtered;
  }, [chartData, filters]);

  /**
   * Calculate summary statistics
   */
  const summaryStats = useMemo(() => {
    const stats = {
      totalDataPoints: 0,
      metricsCount: Object.keys(filteredData).length,
      avgProcessingTime: processingTime,
    };

    Object.values(filteredData).forEach((metricData) => {
      stats.totalDataPoints += metricData.length;
    });

    return stats;
  }, [filteredData, processingTime]);

  return {
    chartData,
    filteredData,
    summaryStats,
    processingTime,
  };
};

/**
 * Network chart data processing
 */
export interface NetworkChartDataPoint {
  url: string;
  method: string;
  type: string;
  contextKey: string;
  contextLabel: string;
  product: string;
  network: string;
  cpu: string;
  userState: string;
  browser: string;
  mean: number;
  min: number;
  max: number;
  count: number;
  measurements: Array<{
    iteration: number;
    duration: number;
    status: number;
    size: number;
    startTime: number;
    endTime: number;
  }>;
}

export interface NetworkFilterState {
  selectedRequestTypes: string[];
  selectedProducts: string[];
  selectedNetworks: string[];
  selectedCpus: string[];
  selectedUserStates: string[];
  selectedContext: string;
}

/**
 * Hook for processing network chart data with caching
 */
export const useNetworkChartData = (
  data: NetworkAnalysisReport | null,
  filters: NetworkFilterState
) => {
  const [processingTime, setProcessingTime] = useState(0);

  /**
   * Transform network data with caching
   */
  const chartData = useMemo(() => {
    if (!data || !data.products?.[0]) return {};

    const startTime = performance.now();
    const firstProduct = data.products[0];
    const results = firstProduct.results || [];

    const cacheKey = createCacheKey('network_chart', data.timestamp, filters);

    // Check cache
    const cached = chartDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProcessingTime(performance.now() - startTime);
      return cached.data as Record<string, NetworkChartDataPoint[]>;
    }

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
          product: firstProduct.product,
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

    // Cache the result
    chartDataCache.set(cacheKey, {
      data: transformedData,
      timestamp: Date.now(),
    });

    const endTime = performance.now();
    setProcessingTime(endTime - startTime);

    return transformedData;
  }, [data, filters]);

  /**
   * Filter network data
   */
  const filteredData = useMemo(() => {
    const cacheKey = createCacheKey('network_filtered', chartData, filters);

    // Check cache
    const cached = chartDataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as Record<string, NetworkChartDataPoint[]>;
    }

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

    // Cache the result
    chartDataCache.set(cacheKey, {
      data: filtered,
      timestamp: Date.now(),
    });

    return filtered;
  }, [chartData, filters]);

  /**
   * Flatten filtered data for charts
   */
  const flatFilteredData = useMemo(() => {
    return Object.values(filteredData).flat();
  }, [filteredData]);

  /**
   * Available iterations for waterfall chart
   */
  const availableIterations = useMemo(() => {
    const iterations = new Set<number>();
    flatFilteredData.forEach((request) => {
      request.measurements.forEach((measurement) => {
        iterations.add(measurement.iteration);
      });
    });
    return Array.from(iterations).sort((a, b) => a - b);
  }, [flatFilteredData]);

  return {
    chartData,
    filteredData,
    flatFilteredData,
    availableIterations,
    processingTime,
  };
};

/**
 * Clear chart data cache
 */
export const clearChartDataCache = () => {
  chartDataCache.clear();
};

/**
 * Get cache statistics
 */
export const getChartCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [, entry] of chartDataCache.entries()) {
    if (now - entry.timestamp < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: chartDataCache.size,
    validEntries,
    expiredEntries,
    cacheHitRate: validEntries / Math.max(1, chartDataCache.size),
  };
};
