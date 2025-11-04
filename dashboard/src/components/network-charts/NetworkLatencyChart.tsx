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
import { RequestGroupData, NetworkContextLegendItem, NETWORK_CHART_COLORS } from './types';
import { formatDuration, formatBytes } from './utils';
import { ContextLegend } from '../ContextLegend';

interface Props {
  data: RequestGroupData[];
  products: string[];
  contextLegend: NetworkContextLegendItem[];
  chartType: 'bar' | 'line';
  viewType: 'latency' | 'size' | 'status';
}

export const NetworkLatencyChart: React.FC<Props> = ({
  data,
  products,
  contextLegend,
  chartType,
  viewType,
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{dataPoint.shortUrl}</p>
          <p className="text-sm text-gray-600 mb-2">
            {dataPoint.method} • {dataPoint.type.toUpperCase()}
          </p>
          <div className="text-xs text-gray-500 whitespace-pre-line mb-3">
            {dataPoint.contextLabel}
          </div>
          
          {payload.map((entry: any, index: number) => {
            const product = entry.dataKey;
            const value = entry.value;
            const minValue = dataPoint[`${product}_min`];
            const maxValue = dataPoint[`${product}_max`];
            const count = dataPoint[`${product}_count`];
            
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
            
            return (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium text-gray-700">{product}:</span>
                  <span className="font-semibold">{formattedValue}</span>
                </div>
                <div className="text-xs text-gray-500 ml-5">
                  Range: {formattedMin} - {formattedMax} ({count} measurements)
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Get the value accessor based on view type
  const getValueAccessor = (product: string) => {
    switch (viewType) {
      case 'size':
        return (dataPoint: RequestGroupData) => {
          const measurements = dataPoint[`${product}_measurements`] as any[];
          if (!measurements || measurements.length === 0) return 0;
          const sizes = measurements.map(m => m.size);
          return sizes.reduce((a, b) => a + b, 0) / sizes.length;
        };
      case 'status':
        return (dataPoint: RequestGroupData) => {
          const measurements = dataPoint[`${product}_measurements`] as any[];
          if (!measurements || measurements.length === 0) return 0;
          // Return most common status code
          const statusCounts: Record<number, number> = {};
          measurements.forEach(m => {
            statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
          });
          return parseInt(Object.keys(statusCounts).reduce((a, b) => 
            statusCounts[parseInt(a)] > statusCounts[parseInt(b)] ? a : b
          ));
        };
      default: // latency
        return (dataPoint: RequestGroupData) => dataPoint[product] as number;
    }
  };

  // Prepare chart data with proper value accessors
  const chartData = data.map(dataPoint => {
    const result: any = {
      ...dataPoint,
      shortLabel: `${dataPoint.contextIndex}`,
    };
    
    products.forEach(product => {
      const valueAccessor = getValueAccessor(product);
      result[product] = valueAccessor(dataPoint);
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
          <Legend />
          {products.map((product, index) => (
            <Line
              key={product}
              type="monotone"
              dataKey={product}
              stroke={NETWORK_CHART_COLORS[index % NETWORK_CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
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
        <Legend />
        {products.map((product, index) => (
          <Bar
            key={product}
            dataKey={product}
            fill={NETWORK_CHART_COLORS[index % NETWORK_CHART_COLORS.length]}
            radius={[2, 2, 0, 0]}
          >
            <ErrorBar
              dataKey={`${product}_min`}
              width={4}
              stroke="#666"
              strokeWidth={1}
            />
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
