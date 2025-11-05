import React from 'react';
import { NetworkResults } from '@/types/reports';
import { NetworkChartDataPoint, NetworkFilterState } from './types';
import { formatDuration, formatBytes } from './utils';

interface Props {
  data: NetworkResults;
  filteredData: Record<string, NetworkChartDataPoint[]>;
  filters: NetworkFilterState;
}

export const NetworkSummary: React.FC<Props> = ({ filteredData }) => {
  // Calculate overall statistics
  const allRequests = Object.values(filteredData).flat();
  const totalRequests = allRequests.length;

  if (totalRequests === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Network Analysis Summary</h3>
        <p className="text-gray-600">No data available for the selected filters.</p>
      </div>
    );
  }

  // Get all measurements and group by iteration
  const allMeasurements = allRequests.flatMap((req) => req.measurements);
  const iterationGroups = allMeasurements.reduce(
    (acc, measurement) => {
      const iteration = measurement.iteration;
      if (!acc[iteration]) {
        acc[iteration] = [];
      }
      acc[iteration].push(measurement);
      return acc;
    },
    {} as Record<number, typeof allMeasurements>
  );

  // Calculate average total duration and size across all iterations
  // Duration: from earliest start to latest end (accounting for parallel requests)
  // Size: sum of all response sizes (this is additive)
  const iterationTotals = Object.values(iterationGroups).map((measurements) => {
    const startTimes = measurements.map((m) => m.startTime);
    const endTimes = measurements.map((m) => m.startTime + m.duration);

    const earliestStart = Math.min(...startTimes);
    const latestEnd = Math.max(...endTimes);

    return {
      totalDuration: latestEnd - earliestStart, // Time span from first start to last end
      totalSize: measurements.reduce((sum, m) => sum + m.size, 0), // Sum of all sizes
    };
  });

  const avgIterationDuration =
    iterationTotals.reduce((sum, iter) => sum + iter.totalDuration, 0) / iterationTotals.length;
  const avgIterationSize =
    iterationTotals.reduce((sum, iter) => sum + iter.totalSize, 0) / iterationTotals.length;

  // Request type distribution with detailed stats using iteration averages
  const typeStats = allRequests.reduce(
    (acc, req) => {
      const type = req.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          avgDuration: 0,
          avgSize: 0,
          requests: [],
        };
      }

      acc[type].count += 1;
      acc[type].requests.push(req);

      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        avgDuration: number;
        avgSize: number;
        requests: typeof allRequests;
      }
    >
  );

  // Calculate average duration and size by type across iterations
  Object.keys(typeStats).forEach((type) => {
    const typeRequests = typeStats[type].requests;

    // Group measurements by iteration for this type
    const typeMeasurementsByIteration = typeRequests.reduce(
      (acc, req) => {
        req.measurements.forEach((measurement) => {
          const iteration = measurement.iteration;
          if (!acc[iteration]) {
            acc[iteration] = [];
          }
          acc[iteration].push(measurement);
        });
        return acc;
      },
      {} as Record<number, typeof allMeasurements>
    );

    // Calculate time span and total size per iteration for this type
    const typeIterationTotals = Object.values(typeMeasurementsByIteration).map((measurements) => {
      const startTimes = measurements.map((m) => m.startTime);
      const endTimes = measurements.map((m) => m.startTime + m.duration);

      const earliestStart = Math.min(...startTimes);
      const latestEnd = Math.max(...endTimes);

      return {
        totalDuration: latestEnd - earliestStart, // Time span for this type in this iteration
        totalSize: measurements.reduce((sum, m) => sum + m.size, 0), // Sum of all sizes for this type
      };
    });

    // Average across iterations
    typeStats[type].avgDuration =
      typeIterationTotals.reduce((sum, iter) => sum + iter.totalDuration, 0) /
      typeIterationTotals.length;
    typeStats[type].avgSize =
      typeIterationTotals.reduce((sum, iter) => sum + iter.totalSize, 0) /
      typeIterationTotals.length;
  });

  // Find extreme requests
  const fastestRequest = allRequests.reduce((prev, current) =>
    prev.min < current.min ? prev : current
  );

  const slowestRequest = allRequests.reduce((prev, current) =>
    prev.max > current.max ? prev : current
  );

  const largestRequest = allRequests.reduce((prev, current) => {
    const prevSize = Math.max(...prev.measurements.map((m) => m.size));
    const currentSize = Math.max(...current.measurements.map((m) => m.size));
    return prevSize > currentSize ? prev : current;
  });

  const smallestRequest = allRequests.reduce((prev, current) => {
    const prevSize = Math.min(...prev.measurements.map((m) => m.size));
    const currentSize = Math.min(...current.measurements.map((m) => m.size));
    return prevSize < currentSize ? prev : current;
  });

  // Get top 3 requests for each category by type
  const getTop3ByType = (
    requests: typeof allRequests,
    sortFn: (a: NetworkChartDataPoint, b: NetworkChartDataPoint) => number
  ) => {
    const byType: Record<string, typeof allRequests> = {};

    requests.forEach((req) => {
      if (!byType[req.type]) byType[req.type] = [];
      byType[req.type].push(req);
    });

    Object.keys(byType).forEach((type) => {
      byType[type] = byType[type].sort(sortFn).slice(0, 3);
    });

    return byType;
  };

  const top3Largest = getTop3ByType(allRequests, (a, b) => {
    const aSize = Math.max(...a.measurements.map((m) => m.size));
    const bSize = Math.max(...b.measurements.map((m) => m.size));
    return bSize - aSize;
  });

  const top3Smallest = getTop3ByType(allRequests, (a, b) => {
    const aSize = Math.min(...a.measurements.map((m) => m.size));
    const bSize = Math.min(...b.measurements.map((m) => m.size));
    return aSize - bSize;
  });

  const top3Fastest = getTop3ByType(allRequests, (a, b) => a.min - b.min);

  const top3Slowest = getTop3ByType(allRequests, (a, b) => b.max - a.max);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Network Analysis Summary</h3>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-900">Total Requests</div>
          <div className="text-2xl font-bold text-blue-700">{totalRequests}</div>
          <div className="text-xs text-blue-600">Unique request URLs</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-900">Avg Duration</div>
          <div className="text-2xl font-bold text-green-700">
            {formatDuration(avgIterationDuration)}
          </div>
          <div className="text-xs text-green-600">Mean per iteration</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-900">Avg Size</div>
          <div className="text-2xl font-bold text-purple-700">{formatBytes(avgIterationSize)}</div>
          <div className="text-xs text-purple-600">Mean per iteration</div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-900">Request Types</div>
          <div className="text-2xl font-bold text-orange-700">{Object.keys(typeStats).length}</div>
          <div className="text-xs text-orange-600">Different types</div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Request Count by Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-4">Request Count by Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeStats)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([type, stats]) => (
              <div key={type} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-600 uppercase">{type}</div>
                <div className="text-lg font-bold text-gray-800">{stats.count}</div>
                <div className="text-xs text-gray-500">
                  {Math.round((stats.count / totalRequests) * 100)}% of total
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Size by Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-4">Average Size by Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeStats)
            .sort(([, a], [, b]) => b.avgSize - a.avgSize)
            .map(([type, stats]) => (
              <div key={type} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-600 uppercase">{type}</div>
                <div className="text-lg font-bold text-gray-800">{formatBytes(stats.avgSize)}</div>
                <div className="text-xs text-gray-500">Mean per iteration</div>
              </div>
            ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Duration by Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-4">Average Time Span by Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeStats)
            .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
            .map(([type, stats]) => (
              <div key={type} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs font-medium text-gray-600 uppercase">{type}</div>
                <div className="text-lg font-bold text-gray-800">
                  {formatDuration(stats.avgDuration)}
                </div>
                <div className="text-xs text-gray-500">Time span per iteration</div>
              </div>
            ))}
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Extreme Requests */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-6">Extreme Requests</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-semibold text-green-800 mb-3">Fastest Request</h5>
            <div className="text-sm space-y-1">
              <div className="font-medium text-green-700">{formatDuration(fastestRequest.min)}</div>
              <div className="text-green-600 break-all text-xs">{fastestRequest.url}</div>
              <div className="text-green-500 text-xs">
                {fastestRequest.method} • {fastestRequest.type.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h5 className="font-semibold text-red-800 mb-3">Slowest Request</h5>
            <div className="text-sm space-y-1">
              <div className="font-medium text-red-700">{formatDuration(slowestRequest.max)}</div>
              <div className="text-red-600 break-all text-xs">{slowestRequest.url}</div>
              <div className="text-red-500 text-xs">
                {slowestRequest.method} • {slowestRequest.type.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-semibold text-yellow-800 mb-3">Largest Request</h5>
            <div className="text-sm space-y-1">
              <div className="font-medium text-yellow-700">
                {formatBytes(Math.max(...largestRequest.measurements.map((m) => m.size)))}
              </div>
              <div className="text-yellow-600 break-all text-xs">{largestRequest.url}</div>
              <div className="text-yellow-500 text-xs">
                {largestRequest.method} • {largestRequest.type.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-3">Smallest Request</h5>
            <div className="text-sm space-y-1">
              <div className="font-medium text-blue-700">
                {formatBytes(Math.min(...smallestRequest.measurements.map((m) => m.size)))}
              </div>
              <div className="text-blue-600 break-all text-xs">{smallestRequest.url}</div>
              <div className="text-blue-500 text-xs">
                {smallestRequest.method} • {smallestRequest.type.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Top 3 Analysis by Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-800 mb-6">Top 3 Analysis by Type</h4>
        <div className="space-y-8">
          {/* Top 3 Largest by Type */}
          <div>
            <h5 className="font-medium text-gray-700 mb-4">Top 3 Largest Requests by Type</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(top3Largest).map(([type, requests]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-3 uppercase text-sm">{type}</h6>
                  <div className="space-y-2">
                    {requests.map((req, index) => (
                      <div key={`${req.url}-${index}`} className="text-xs">
                        <div className="font-medium text-gray-800">
                          #{index + 1}:{' '}
                          {formatBytes(Math.max(...req.measurements.map((m) => m.size)))}
                        </div>
                        <div className="text-gray-600 break-all">{req.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Smallest by Type */}
          <div>
            <h5 className="font-medium text-gray-700 mb-4">Top 3 Smallest Requests by Type</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(top3Smallest).map(([type, requests]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-3 uppercase text-sm">{type}</h6>
                  <div className="space-y-2">
                    {requests.map((req, index) => (
                      <div key={`${req.url}-${index}`} className="text-xs">
                        <div className="font-medium text-gray-800">
                          #{index + 1}:{' '}
                          {formatBytes(Math.min(...req.measurements.map((m) => m.size)))}
                        </div>
                        <div className="text-gray-600 break-all">{req.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Fastest by Type */}
          <div>
            <h5 className="font-medium text-gray-700 mb-4">Top 3 Fastest Requests by Type</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(top3Fastest).map(([type, requests]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-3 uppercase text-sm">{type}</h6>
                  <div className="space-y-2">
                    {requests.map((req, index) => (
                      <div key={`${req.url}-${index}`} className="text-xs">
                        <div className="font-medium text-gray-800">
                          #{index + 1}: {formatDuration(req.min)}
                        </div>
                        <div className="text-gray-600 break-all">{req.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Slowest by Type */}
          <div>
            <h5 className="font-medium text-gray-700 mb-4">Top 3 Slowest Requests by Type</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(top3Slowest).map(([type, requests]) => (
                <div key={type} className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-3 uppercase text-sm">{type}</h6>
                  <div className="space-y-2">
                    {requests.map((req, index) => (
                      <div key={`${req.url}-${index}`} className="text-xs">
                        <div className="font-medium text-gray-800">
                          #{index + 1}: {formatDuration(req.max)}
                        </div>
                        <div className="text-gray-600 break-all">{req.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
