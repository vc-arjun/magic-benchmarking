import React from 'react';
import { NetworkResults } from '@/types/reports';
import { NetworkChartDataPoint, NetworkFilterState } from './types';
import { formatDuration, formatBytes, calculateRequestStats } from './utils';

interface Props {
  data: NetworkResults;
  filteredData: Record<string, NetworkChartDataPoint[]>;
  filters: NetworkFilterState;
}

export const NetworkSummary: React.FC<Props> = ({ data, filteredData, filters }) => {
  // Calculate overall statistics
  const allRequests = Object.values(filteredData).flat();
  const totalRequests = allRequests.length;
  
  if (totalRequests === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Network Summary</h3>
        <p className="text-gray-600">No data available for the selected filters.</p>
      </div>
    );
  }

  // Calculate aggregated statistics
  const allMeasurements = allRequests.flatMap(req => req.measurements);
  const durations = allMeasurements.map(m => m.duration);
  const sizes = allMeasurements.map(m => m.size);
  const statusCodes = allMeasurements.map(m => m.status);

  const durationStats = {
    min: Math.min(...durations),
    max: Math.max(...durations),
    mean: durations.reduce((a, b) => a + b, 0) / durations.length,
  };

  const sizeStats = {
    min: Math.min(...sizes),
    max: Math.max(...sizes),
    mean: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    total: sizes.reduce((a, b) => a + b, 0),
  };

  // Status code distribution
  const statusDistribution = statusCodes.reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Request type distribution
  const typeDistribution = allRequests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find slowest and largest requests
  const slowestRequest = allRequests.reduce((prev, current) => 
    prev.max > current.max ? prev : current
  );

  const largestRequest = allRequests.reduce((prev, current) => {
    const prevSize = Math.max(...prev.measurements.map(m => m.size));
    const currentSize = Math.max(...current.measurements.map(m => m.size));
    return prevSize > currentSize ? prev : current;
  });

  // Context distribution
  const contextDistribution = allRequests.reduce((acc, req) => {
    const key = `${req.network} | ${req.cpu} | ${req.userState}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Network Analysis Summary</h3>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-900">Total Requests</div>
          <div className="text-2xl font-bold text-blue-700">{totalRequests}</div>
          <div className="text-xs text-blue-600">{allMeasurements.length} measurements</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-900">Avg Duration</div>
          <div className="text-2xl font-bold text-green-700">{formatDuration(durationStats.mean)}</div>
          <div className="text-xs text-green-600">
            {formatDuration(durationStats.min)} - {formatDuration(durationStats.max)}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-900">Total Size</div>
          <div className="text-2xl font-bold text-purple-700">{formatBytes(sizeStats.total)}</div>
          <div className="text-xs text-purple-600">Avg: {formatBytes(sizeStats.mean)}</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-900">Success Rate</div>
          <div className="text-2xl font-bold text-orange-700">
            {Math.round((statusCodes.filter(s => s >= 200 && s < 300).length / statusCodes.length) * 100)}%
          </div>
          <div className="text-xs text-orange-600">
            {statusCodes.filter(s => s >= 200 && s < 300).length} / {statusCodes.length}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Duration Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Duration Statistics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-medium">{formatDuration(durationStats.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-medium">{formatDuration(durationStats.max)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-medium">{formatDuration(durationStats.mean)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Measurements:</span>
              <span className="font-medium">{durations.length}</span>
            </div>
          </div>
        </div>

        {/* Size Statistics */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Size Statistics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum:</span>
              <span className="font-medium">{formatBytes(sizeStats.min)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maximum:</span>
              <span className="font-medium">{formatBytes(sizeStats.max)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-medium">{formatBytes(sizeStats.mean)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{formatBytes(sizeStats.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Request Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Request Types</h4>
          <div className="space-y-2">
            {Object.entries(typeDistribution)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / totalRequests) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Status Code Distribution */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3">Status Codes</h4>
          <div className="space-y-2">
            {Object.entries(statusDistribution)
              .sort(([,a], [,b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    parseInt(status) >= 200 && parseInt(status) < 300
                      ? 'text-green-600'
                      : parseInt(status) >= 300 && parseInt(status) < 400
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          parseInt(status) >= 200 && parseInt(status) < 300
                            ? 'bg-green-500'
                            : parseInt(status) >= 300 && parseInt(status) < 400
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${(count / allMeasurements.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Notable Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-3">Slowest Request</h4>
          <div className="text-sm space-y-1">
            <div className="font-medium text-red-700">
              {formatDuration(slowestRequest.max)}
            </div>
            <div 
              className="text-red-600 cursor-help break-all text-xs" 
              title={`Full URL: ${slowestRequest.url}`}
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {slowestRequest.url}
            </div>
            <div className="text-red-500 text-xs">
              {slowestRequest.method} • {slowestRequest.type.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-3">Largest Request</h4>
          <div className="text-sm space-y-1">
            <div className="font-medium text-yellow-700">
              {formatBytes(Math.max(...largestRequest.measurements.map(m => m.size)))}
            </div>
            <div 
              className="text-yellow-600 cursor-help break-all text-xs" 
              title={`Full URL: ${largestRequest.url}`}
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {largestRequest.url}
            </div>
            <div className="text-yellow-500 text-xs">
              {largestRequest.method} • {largestRequest.type.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
