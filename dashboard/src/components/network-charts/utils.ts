import { NetworkRequestType } from '@/types/reports';
import {
  NetworkChartDataPoint,
  NetworkContextLegendItem,
  RequestGroupData,
  WaterfallDataPoint,
  REQUEST_TYPE_COLORS,
} from './types';

// Parse context key into components for network data
export const parseNetworkContextKey = (contextKey: string) => {
  const parts = contextKey.split('_');

  // For network data, we expect: network_cpu_userState format
  // Handle cases like "slow_4g_no_throttling_new_user"
  let network = '';
  let cpu = '';
  let userState = '';

  if (parts.includes('4g')) {
    // Handle slow_4g case
    const fourGIndex = parts.findIndex((part) => part === '4g');
    network = parts.slice(0, fourGIndex + 1).join('_');
    const remaining = parts.slice(fourGIndex + 1);

    if (remaining.includes('throttling')) {
      const throttlingIndex = remaining.findIndex((part) => part === 'throttling');
      cpu = remaining.slice(0, throttlingIndex + 1).join('_');
      userState = remaining.slice(throttlingIndex + 1).join('_');
    }
  } else if (parts.includes('throttling')) {
    // Handle no_throttling case
    const throttlingIndex = parts.findIndex((part) => part === 'throttling');
    network = parts.slice(0, throttlingIndex - 1).join('_');
    cpu = parts.slice(throttlingIndex - 1, throttlingIndex + 1).join('_');
    userState = parts.slice(throttlingIndex + 1).join('_');
  }

  return { network, cpu, userState };
};

// Format context labels for network data
export const formatNetworkContextLabel = (contextKey: string) => {
  const { network, cpu, userState } = parseNetworkContextKey(contextKey);

  const formatPart = (part: string) =>
    part
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/4x/g, '4×');

  return `Network: ${formatPart(network)}\nCPU: ${formatPart(cpu)}\nUser State: ${formatPart(userState)}`;
};

// Create a global legend mapping for network execution contexts
export const createNetworkContextLegend = (
  requestData: NetworkChartDataPoint[]
): NetworkContextLegendItem[] => {
  const uniqueContexts = [...new Set(requestData.map((point) => point.contextKey))];
  return uniqueContexts.map((contextKey, index) => ({
    index: index + 1,
    contextKey,
    contextLabel: formatNetworkContextLabel(contextKey),
  }));
};

// Transform network data for chart visualization - request-wise grouping
export const transformNetworkChartData = (
  requestData: NetworkChartDataPoint[]
): { groupedData: RequestGroupData[]; contextLegend: NetworkContextLegendItem[] } => {
  // Create context legend
  const contextLegend = createNetworkContextLegend(requestData);

  // Group data by context (execution environment) for x-axis
  const contextGroups = requestData.reduce(
    (acc, point) => {
      if (!acc[point.contextKey]) {
        acc[point.contextKey] = [];
      }
      acc[point.contextKey].push(point);
      return acc;
    },
    {} as Record<string, NetworkChartDataPoint[]>
  );

  // Create grouped data with each context as a data point and each request as a separate series
  const groupedData = Object.entries(contextGroups).map(([contextKey, points]) => {
    // Find the index for this context
    const contextIndex =
      contextLegend.find((legend) => legend.contextKey === contextKey)?.index || 1;

    const dataPoint: RequestGroupData = {
      url: '', // Not used for context grouping
      shortUrl: '', // Not used for context grouping
      method: '', // Not used for context grouping
      type: 'other' as NetworkRequestType, // Not used for context grouping
      contextLabel: formatNetworkContextLabel(contextKey),
      contextKey: contextKey,
      shortLabel: contextIndex.toString(),
      contextIndex: contextIndex,
    };

    // Add each request as a separate field in the data point
    points.forEach((point) => {
      const requestKey = createRequestKey(point.url, point.method, point.type);
      dataPoint[requestKey] = point.mean;
      dataPoint[`${requestKey}_min`] = point.min;
      dataPoint[`${requestKey}_max`] = point.max;
      dataPoint[`${requestKey}_count`] = point.count;
      dataPoint[`${requestKey}_measurements`] = point.measurements;
      dataPoint[`${requestKey}_url`] = point.url;
      dataPoint[`${requestKey}_method`] = point.method;
      dataPoint[`${requestKey}_type`] = point.type;
    });

    return dataPoint;
  });

  return { groupedData, contextLegend };
};

// Create a unique key for each request
export const createRequestKey = (url: string, method: string, type: string): string => {
  const urlObj = new URL(url);
  const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;
  return `${method}_${type}_${shortUrl}`.replace(/[^a-zA-Z0-9_]/g, '_');
};

// Get all unique requests from the data
export const getUniqueRequests = (
  requestData: NetworkChartDataPoint[]
): Array<{
  key: string;
  url: string;
  method: string;
  type: string;
  shortUrl: string;
}> => {
  const uniqueRequests = new Map();

  requestData.forEach((point) => {
    const key = createRequestKey(point.url, point.method, point.type);
    if (!uniqueRequests.has(key)) {
      const urlObj = new URL(point.url);
      const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;
      uniqueRequests.set(key, {
        key,
        url: point.url,
        method: point.method,
        type: point.type,
        shortUrl: shortUrl.length > 40 ? `${shortUrl.substring(0, 37)}...` : shortUrl,
      });
    }
  });

  return Array.from(uniqueRequests.values());
};

// Transform data for waterfall chart using mean values
export const transformWaterfallData = (
  requestData: NetworkChartDataPoint[]
): WaterfallDataPoint[] => {
  const waterfallData: WaterfallDataPoint[] = [];

  requestData.forEach((request, index) => {
    // Calculate mean values from all measurements
    const measurements = request.measurements;
    if (measurements.length === 0) return;

    const meanStartTime =
      measurements.reduce((sum, m) => sum + m.startTime, 0) / measurements.length;
    const meanDuration = request.mean; // Already calculated
    const meanEndTime = meanStartTime + meanDuration;
    const meanSize = measurements.reduce((sum, m) => sum + m.size, 0) / measurements.length;

    // Get most common status code
    const statusCounts: Record<number, number> = {};
    measurements.forEach((m) => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });
    const mostCommonStatus = parseInt(
      Object.keys(statusCounts).reduce((a, b) =>
        statusCounts[parseInt(a)] > statusCounts[parseInt(b)] ? a : b
      )
    );

    waterfallData.push({
      id: `${index}`,
      url: request.url,
      shortUrl: (() => {
        const urlObj = new URL(request.url);
        const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;
        return shortUrl.length > 40 ? `${shortUrl.substring(0, 37)}...` : shortUrl;
      })(),
      type: request.type,
      method: request.method,
      startTime: meanStartTime,
      duration: meanDuration,
      endTime: meanEndTime,
      status: mostCommonStatus,
      size: meanSize,
      iteration: 0, // Not applicable for mean values
      level: 0, // Will be calculated based on dependencies
      color: REQUEST_TYPE_COLORS[request.type] || '#666666',
    });
  });

  // Sort by start time for waterfall display
  return waterfallData.sort((a, b) => a.startTime - b.startTime);
};

// Format bytes to human readable format
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format duration to human readable format
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Get color for request type
export const getRequestTypeColor = (type: NetworkRequestType): string => {
  return REQUEST_TYPE_COLORS[type] || '#666666';
};

// Calculate statistics for a group of measurements
export const calculateRequestStats = (measurements: { duration: number; size: number }[]) => {
  const durations = measurements.map((m) => m.duration);
  const sizes = measurements.map((m) => m.size);

  return {
    duration: {
      min: Math.min(...durations),
      max: Math.max(...durations),
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
    },
    size: {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
      mean: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    },
    count: measurements.length,
  };
};
