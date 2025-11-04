import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import {
  RequestGroupData,
  NetworkContextLegendItem,
  NETWORK_CHART_COLORS,
  NetworkChartDataPoint,
} from './types';
import { formatDuration, formatBytes, getUniqueRequests } from './utils';
import { ContextLegend } from '../ContextLegend';

// Interface for tooltip data point
interface TooltipDataPoint {
  contextLabel: string;
  [key: string]:
    | string
    | number
    | {
        size: number;
        duration: number;
        status: number;
        iteration: number;
        startTime: number;
        endTime: number;
      }[]
    | undefined;
}

interface Props {
  data: RequestGroupData[];
  requestData: NetworkChartDataPoint[];
  contextLegend: NetworkContextLegendItem[];
  chartType: 'bar' | 'line';
  viewType: 'latency' | 'size' | 'status';
}

export const NetworkLatencyChart: React.FC<Props> = ({
  data,
  requestData,
  contextLegend,
  chartType,
  viewType,
}) => {
  // Get unique requests to create separate lines
  const uniqueRequests = getUniqueRequests(requestData);
  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { dataKey: string; value: number; color: string; payload: TooltipDataPoint }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;

      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg max-w-md">
          <div className="text-xs text-gray-500 whitespace-pre-line mb-3">
            <strong>Execution Context:</strong>
            <br />
            {dataPoint.contextLabel}
          </div>

          {payload.map(
            (
              entry: { dataKey: string; value: number; color: string; payload: TooltipDataPoint },
              index: number
            ) => {
              const requestKey = entry.dataKey;
              const value = entry.value;
              const minValue = dataPoint[`${requestKey}_min`] as number;
              const maxValue = dataPoint[`${requestKey}_max`] as number;
              const count = dataPoint[`${requestKey}_count`] as number;
              const url = dataPoint[`${requestKey}_url`] as string;
              const method = dataPoint[`${requestKey}_method`] as string;
              const type = dataPoint[`${requestKey}_type`] as string;
              const measurements =
                (dataPoint[`${requestKey}_measurements`] as {
                  size: number;
                  duration: number;
                  status: number;
                  iteration: number;
                  startTime: number;
                  endTime: number;
                }[]) || [];

              if (!url) return null;

              let formattedValue = '';
              let formattedMin = '';
              let formattedMax = '';

              if (viewType === 'latency') {
                formattedValue = formatDuration(value);
                formattedMin = formatDuration(minValue);
                formattedMax = formatDuration(maxValue);
              } else if (viewType === 'size') {
                formattedValue = formatBytes(value);
                formattedMin = formatBytes(minValue);
                formattedMax = formatBytes(maxValue);
              } else {
                formattedValue = value.toString();
                formattedMin = minValue.toString();
                formattedMax = maxValue.toString();
              }

              // Calculate average size from measurements
              const avgSize =
                measurements.length > 0
                  ? formatBytes(
                      measurements.reduce((sum: number, m: { size: number }) => sum + m.size, 0) /
                        measurements.length
                    )
                  : 'N/A';

              return (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                    <span className="font-medium text-gray-700 text-sm">
                      {method} • {type?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mb-2 break-all" title={url || ''}>
                    <strong>URL:</strong> {url || 'Unknown URL'}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>
                        Mean{' '}
                        {viewType === 'latency'
                          ? 'Duration'
                          : viewType === 'size'
                            ? 'Size'
                            : 'Status'}
                        :
                      </strong>
                      <br />
                      <span className="font-semibold text-blue-600">{formattedValue}</span>
                    </div>
                    <div>
                      <strong>Range:</strong>
                      <br />
                      <span className="text-gray-600">
                        {formattedMin} - {formattedMax}
                      </span>
                    </div>
                    <div>
                      <strong>Iterations:</strong>
                      <br />
                      <span className="text-gray-600">{count || 0}</span>
                    </div>
                    <div>
                      <strong>Avg Size:</strong>
                      <br />
                      <span className="text-gray-600">{avgSize}</span>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      );
    }
    return null;
  };

  // Get the value accessor based on view type for requests
  const getValueAccessor = (requestKey: string) => {
    switch (viewType) {
      case 'size':
        return (dataPoint: RequestGroupData) => {
          const measurements = dataPoint[`${requestKey}_measurements`] as { size: number }[];
          if (!measurements || measurements.length === 0) return 0;
          const sizes = measurements.map((m) => m.size);
          return sizes.reduce((a, b) => a + b, 0) / sizes.length;
        };
      case 'status':
        return (dataPoint: RequestGroupData) => {
          const measurements = dataPoint[`${requestKey}_measurements`] as { status: number }[];
          if (!measurements || measurements.length === 0) return 0;
          // Return most common status code
          const statusCounts: Record<number, number> = {};
          measurements.forEach((m) => {
            statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
          });
          return parseInt(
            Object.keys(statusCounts).reduce((a, b) =>
              statusCounts[parseInt(a)] > statusCounts[parseInt(b)] ? a : b
            )
          );
        };
      default: // latency
        return (dataPoint: RequestGroupData) => dataPoint[requestKey] as number;
    }
  };

  // Prepare chart data with proper value accessors
  const chartData = data.map((dataPoint) => {
    const result: Record<string, unknown> = {
      ...dataPoint,
      shortLabel: `${dataPoint.contextIndex}`,
    };

    uniqueRequests.forEach((request) => {
      const valueAccessor = getValueAccessor(request.key);
      result[request.key] = valueAccessor(dataPoint);
    });

    return result;
  });

  // Format Y-axis labels
  const formatYAxisLabel = (value: number) => {
    switch (viewType) {
      case 'latency':
        return formatDuration(value);
      case 'size':
        return formatBytes(value);
      default:
        return value.toString();
    }
  };

  // Get Y-axis label
  const getYAxisLabel = () => {
    switch (viewType) {
      case 'latency':
        return 'Duration (ms)';
      case 'size':
        return 'Size (bytes)';
      case 'status':
        return 'Status Code';
      default:
        return 'Value';
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="shortLabel"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={formatYAxisLabel}
            tick={{ fontSize: 12 }}
            label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value: string) => {
              const request = uniqueRequests.find((r) => r.key === value);
              return request ? <span title={request.url}>{request.shortUrl}</span> : value;
            }}
          />
          {uniqueRequests.map((request, index) => (
            <Line
              key={request.key}
              type="monotone"
              dataKey={request.key}
              stroke={NETWORK_CHART_COLORS[index % NETWORK_CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={request.shortUrl}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="shortLabel"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tickFormatter={formatYAxisLabel}
          tick={{ fontSize: 12 }}
          label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value: string) => {
            const request = uniqueRequests.find((r) => r.key === value);
            return request ? <span title={request.url}>{request.shortUrl}</span> : value;
          }}
        />
        {uniqueRequests.map((request, index) => (
          <Bar
            key={request.key}
            dataKey={request.key}
            fill={NETWORK_CHART_COLORS[index % NETWORK_CHART_COLORS.length]}
            radius={[2, 2, 0, 0]}
            name={request.shortUrl}
          >
            <ErrorBar dataKey={`${request.key}_min`} width={4} stroke="#666" strokeWidth={1} />
          </Bar>
        ))}
      </BarChart>
    );
  };

  return (
    <div className="w-full">
      <div className="flex gap-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {contextLegend.length > 1 && (
          <div className="w-80">
            <ContextLegend items={contextLegend} />
          </div>
        )}
      </div>
    </div>
  );
};
