import { NetworkResults, NetworkRequestType } from '@/types/reports';
import { 
  NetworkChartDataPoint, 
  NetworkContextLegendItem, 
  RequestGroupData, 
  WaterfallDataPoint,
  REQUEST_TYPE_COLORS 
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
    const fourGIndex = parts.findIndex(part => part === '4g');
    network = parts.slice(0, fourGIndex + 1).join('_');
    const remaining = parts.slice(fourGIndex + 1);
    
    if (remaining.includes('throttling')) {
      const throttlingIndex = remaining.findIndex(part => part === 'throttling');
      cpu = remaining.slice(0, throttlingIndex + 1).join('_');
      userState = remaining.slice(throttlingIndex + 1).join('_');
    }
  } else if (parts.includes('throttling')) {
    // Handle no_throttling case
    const throttlingIndex = parts.findIndex(part => part === 'throttling');
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

// Transform network data for chart visualization
export const transformNetworkChartData = (
  requestData: NetworkChartDataPoint[]
): { groupedData: RequestGroupData[]; contextLegend: NetworkContextLegendItem[] } => {
  // Create context legend
  const contextLegend = createNetworkContextLegend(requestData);

  // Group data by URL and context for better visualization
  const groupedData = requestData.reduce((acc, point) => {
    const key = `${point.url}_${point.contextKey}`;
    const existing = acc.find((item) => 
      item.url === point.url && item.contextKey === point.contextKey
    );
    
    if (existing) {
      existing[point.product] = point.mean;
      existing[`${point.product}_min`] = point.min;
      existing[`${point.product}_max`] = point.max;
      existing[`${point.product}_count`] = point.count;
      existing[`${point.product}_measurements`] = point.measurements;
    } else {
      // Find the index for this context
      const contextIndex =
        contextLegend.find((legend) => legend.contextKey === point.contextKey)?.index || 1;

      // Create short URL for display
      const urlObj = new URL(point.url);
      const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;

      acc.push({
        url: point.url,
        shortUrl: shortUrl.length > 50 ? `${shortUrl.substring(0, 47)}...` : shortUrl,
        method: point.method,
        type: point.type,
        contextLabel: formatNetworkContextLabel(point.contextKey),
        contextKey: point.contextKey,
        shortLabel: contextIndex.toString(),
        contextIndex: contextIndex,
        [point.product]: point.mean,
        [`${point.product}_min`]: point.min,
        [`${point.product}_max`]: point.max,
        [`${point.product}_count`]: point.count,
        [`${point.product}_measurements`]: point.measurements,
      });
    }
    return acc;
  }, [] as RequestGroupData[]);

  return { groupedData, contextLegend };
};

// Transform data for waterfall chart
export const transformWaterfallData = (
  requestData: NetworkChartDataPoint[],
  selectedIteration: number = 1
): WaterfallDataPoint[] => {
  const waterfallData: WaterfallDataPoint[] = [];
  
  requestData.forEach((request, index) => {
    // Find measurements for the selected iteration
    const iterationMeasurements = request.measurements.filter(
      m => m.iteration === selectedIteration
    );
    
    iterationMeasurements.forEach((measurement, measurementIndex) => {
      waterfallData.push({
        id: `${index}_${measurementIndex}`,
        url: request.url,
        shortUrl: (() => {
          const urlObj = new URL(request.url);
          const shortUrl = `${urlObj.hostname}${urlObj.pathname}`;
          return shortUrl.length > 40 ? `${shortUrl.substring(0, 37)}...` : shortUrl;
        })(),
        type: request.type,
        method: request.method,
        startTime: measurement.startTime,
        duration: measurement.duration,
        endTime: measurement.endTime,
        status: measurement.status,
        size: measurement.size,
        iteration: measurement.iteration,
        level: 0, // Will be calculated based on dependencies
        color: REQUEST_TYPE_COLORS[request.type] || '#666666',
      });
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
export const calculateRequestStats = (measurements: any[]) => {
  const durations = measurements.map(m => m.duration);
  const sizes = measurements.map(m => m.size);
  
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
