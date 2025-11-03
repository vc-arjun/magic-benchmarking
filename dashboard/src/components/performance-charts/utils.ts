import { BenchmarkResults } from '@/types/reports';
import { ChartDataPoint, ContextLegendItem, GroupedDataPoint } from './types';

// Parse context key into components
export const parseContextKey = (contextKey: string, data: BenchmarkResults) => {
  const parts = contextKey.split('_');

  // Find the network value by checking against known network keys
  const networkKeys = Object.keys(data.execution_matrix.network);
  let network = '';
  let remainingParts = [...parts];

  for (const networkKey of networkKeys) {
    const networkParts = networkKey.split('_');
    if (parts.slice(0, networkParts.length).join('_') === networkKey) {
      network = networkKey;
      remainingParts = parts.slice(networkParts.length);
      break;
    }
  }

  // Find the CPU value
  const cpuKeys = Object.keys(data.execution_matrix.cpu);
  let cpu = '';
  let finalParts = [...remainingParts];

  for (const cpuKey of cpuKeys) {
    const cpuParts = cpuKey.split('_');
    if (remainingParts.slice(0, cpuParts.length).join('_') === cpuKey) {
      cpu = cpuKey;
      finalParts = remainingParts.slice(cpuParts.length);
      break;
    }
  }

  // The remaining parts should be the user state
  const userState = finalParts.join('_');

  return { network, cpu, userState };
};

// Format context labels for tooltips (detailed multi-line format)
export const formatContextLabel = (contextKey: string, data: BenchmarkResults) => {
  const { network, cpu, userState } = parseContextKey(contextKey, data);

  const formatPart = (part: string) =>
    part
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/4x/g, '4×');

  return `Network: ${formatPart(network)}\nCPU: ${formatPart(cpu)}\nUser State: ${formatPart(userState)}`;
};

// Create a global legend mapping for execution contexts
export const createContextLegend = (
  metricData: ChartDataPoint[],
  data: BenchmarkResults
): ContextLegendItem[] => {
  const uniqueContexts = [...new Set(metricData.map((point) => point.contextKey))];
  return uniqueContexts.map((contextKey, index) => ({
    index: index + 1,
    contextKey,
    contextLabel: formatContextLabel(contextKey, data),
  }));
};

// Transform and group chart data
export const transformChartData = (
  metricData: ChartDataPoint[],
  data: BenchmarkResults
): { groupedData: GroupedDataPoint[]; contextLegend: ContextLegendItem[] } => {
  // Create context legend for this metric
  const contextLegend = createContextLegend(metricData, data);

  // Group data by context for better visualization
  const groupedData = metricData.reduce((acc, point) => {
    const existing = acc.find((item) => item.contextKey === point.contextKey);
    if (existing) {
      existing[point.product] = point.mean;
      existing[`${point.product}_min`] = point.min;
      existing[`${point.product}_max`] = point.max;
    } else {
      // Find the index for this context
      const contextIndex =
        contextLegend.find((legend) => legend.contextKey === point.contextKey)?.index || 1;

      acc.push({
        contextLabel: formatContextLabel(point.contextKey, data),
        contextKey: point.contextKey,
        shortLabel: contextIndex.toString(),
        contextIndex: contextIndex,
        [point.product]: point.mean,
        [`${point.product}_min`]: point.min,
        [`${point.product}_max`]: point.max,
      });
    }
    return acc;
  }, [] as GroupedDataPoint[]);

  return { groupedData, contextLegend };
};
