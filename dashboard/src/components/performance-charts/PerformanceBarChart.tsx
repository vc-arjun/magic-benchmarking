import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ContextLegend } from '../ContextLegend';
import { GroupedDataPoint, ContextLegendItem, CHART_COLORS } from './types';

interface Props {
  data: GroupedDataPoint[];
  products: string[];
  contextLegend: ContextLegendItem[];
}

export const PerformanceBarChart: React.FC<Props> = ({ data, products, contextLegend }) => {
  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="shortLabel" tick={{ fontSize: 12 }} interval={0} height={40} />
          <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value: string, name: string) => [
              `${parseFloat(value).toFixed(2)} ms`,
              name.replace(/_min|_max/, ''),
            ]}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `Context ${item.contextIndex}: ${item.contextLabel}` : label;
            }}
            contentStyle={{
              fontSize: 12,
              fontWeight: 400,
              color: '#666',
              whiteSpace: 'pre-line',
              lineHeight: '1.4',
            }}
          />
          <Legend />
          {products.map((product, index) => (
            <Bar
              key={product}
              dataKey={product}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              name={product}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <ContextLegend contextLegend={contextLegend} />
    </div>
  );
};
