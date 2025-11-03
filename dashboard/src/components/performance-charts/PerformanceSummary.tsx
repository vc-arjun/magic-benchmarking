import React from 'react';
import { BenchmarkResults } from '@/types/reports';
import { ChartDataPoint, FilterState } from './types';

interface Props {
  data: BenchmarkResults;
  filteredData: Record<string, ChartDataPoint[]>;
  filters: FilterState;
}

export const PerformanceSummary: React.FC<Props> = ({ data, filteredData, filters }) => {
  if (Object.keys(filteredData).length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">📊 Performance Summary</h3>
        <div className="text-sm text-gray-600">Aggregated across all selected contexts</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filters.selectedMetrics.map((metricKey) => {
          const metricInfo = data.metrics_metadata[metricKey as keyof typeof data.metrics_metadata];
          const metricData = filteredData[metricKey] || [];

          if (metricData.length === 0) return null;

          const overallMean =
            metricData.reduce((sum, point) => sum + point.mean, 0) / metricData.length;
          const overallMin = Math.min(...metricData.map((point) => point.min));
          const overallMax = Math.max(...metricData.map((point) => point.max));

          return (
            <div
              key={metricKey}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-gray-800 mb-3 text-base">{metricInfo.name}</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Average:</span>
                  <span className="font-semibold text-gray-900 text-lg">
                    {overallMean.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Best:</span>
                  <span className="font-semibold text-green-600 text-lg">
                    {overallMin.toFixed(2)} ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Worst:</span>
                  <span className="font-semibold text-red-600 text-lg">
                    {overallMax.toFixed(2)} ms
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Variance:</span>
                    <span className="text-gray-700 text-sm font-medium">
                      {(((overallMax - overallMin) / overallMean) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
