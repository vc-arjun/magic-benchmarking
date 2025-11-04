import React, { useState, useMemo } from 'react';
import { WaterfallDataPoint, NetworkChartDataPoint } from './types';
import { formatDuration, formatBytes } from './utils';

interface Props {
  data: WaterfallDataPoint[];
  availableIterations: number[];
  requestData: NetworkChartDataPoint[];
  selectedContext: string;
}

export const NetworkWaterfallChart: React.FC<Props> = ({
  data,
  availableIterations,
  requestData,
  selectedContext,
}) => {
  const [hoveredRequest, setHoveredRequest] = useState<string | null>(null);

  // Since data is already filtered by context globally, we can use it directly
  const iterationData = data;

  // Handle empty data case
  if (iterationData.length === 0) {
    return (
      <div className="w-full">
        {/* Empty State */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="font-medium">No requests found for selected context</p>
            <p className="text-sm mt-1">Try selecting a different execution context from the sidebar</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const minStartTime = Math.min(...iterationData.map((d) => d.startTime));
  const maxEndTime = Math.max(...iterationData.map((d) => d.endTime));
  const totalDuration = maxEndTime - minStartTime;

  const chartWidth = 800;
  const rowHeight = 40;
  const chartHeight = iterationData.length * rowHeight + 60; // Extra space for headers

  // Calculate positions
  const getXPosition = (time: number) => {
    return ((time - minStartTime) / totalDuration) * chartWidth;
  };

  const getWidth = (duration: number) => {
    return (duration / totalDuration) * chartWidth;
  };

  // Group requests by type for legend
  const requestTypes = [...new Set(iterationData.map((d) => d.type))];

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-6">
        {/* Statistics and Legend Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total Duration:</span> {formatDuration(totalDuration)}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Requests:</span> {iterationData.length}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Data:</span> Mean values across{' '}
              {availableIterations.length} iterations
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Request Types:</span>
            {requestTypes.map((type) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: iterationData.find((d) => d.type === type)?.color || '#666666',
                  }}
                />
                <span className="text-xs text-gray-600">{type.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative" style={{ height: chartHeight }}>
          {/* Time axis */}
          <div className="absolute top-0 left-0 w-full h-8 bg-gray-50 border-b border-gray-200">
            <div className="relative h-full">
              {/* Time markers */}
              {Array.from({ length: 11 }, (_, i) => {
                const time = minStartTime + (totalDuration * i) / 10;
                const position = getXPosition(time);
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-300"
                    style={{ left: `${(position / chartWidth) * 100}%` }}
                  >
                    <span className="absolute top-1 left-1 text-xs text-gray-600">
                      {formatDuration(time)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request bars */}
          <div className="absolute top-8 left-0 w-full">
            {iterationData.map((request, index) => {
              const yPosition = index * rowHeight;
              const xPosition = getXPosition(request.startTime);
              const width = getWidth(request.duration);
              const isHovered = hoveredRequest === request.id;

              return (
                <div
                  key={request.id}
                  className="absolute flex items-center"
                  style={{
                    top: yPosition,
                    height: rowHeight,
                    left: 0,
                    right: 0,
                  }}
                  onMouseEnter={() => setHoveredRequest(request.id)}
                  onMouseLeave={() => setHoveredRequest(null)}
                >
                  {/* URL label */}
                  <div className="w-80 px-3 py-2 text-xs text-gray-700 border-r border-gray-200">
                    <div
                      className="font-medium cursor-help break-all"
                      title={`Full URL: ${request.url}`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {request.shortUrl}
                    </div>
                    <div className="text-gray-500">
                      {request.method} • {request.type.toUpperCase()}
                    </div>
                  </div>

                  {/* Timeline area */}
                  <div className="flex-1 relative h-full">
                    {/* Request bar */}
                    <div
                      className={`absolute top-2 h-6 rounded transition-all duration-200 ${
                        isHovered ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                      }`}
                      style={{
                        left: `${(xPosition / chartWidth) * 100}%`,
                        width: `${(width / chartWidth) * 100}%`,
                        backgroundColor: request.color,
                        opacity: isHovered ? 0.9 : 0.7,
                      }}
                    />

                    {/* Hover tooltip */}
                    {isHovered && (
                      <div
                        className="absolute z-10 bg-black text-white text-[10px] rounded px-3 py-2 pointer-events-none max-w-xs"
                        style={{
                          left: `${(xPosition / chartWidth) * 100}%`,
                          top: -20,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className=" pt-1 space-y-1">
                          <div>
                            <strong>Method:</strong> {request.method}
                          </div>
                          <div>
                            <strong>Type:</strong> {request.type.toUpperCase()}
                          </div>
                          <div>
                            <strong>Duration:</strong> {formatDuration(request.duration)}
                          </div>
                          <div>
                            <strong>Size:</strong> {formatBytes(request.size)}
                          </div>
                          <div>
                            <strong>Start Time:</strong> {formatDuration(request.startTime)}
                          </div>
                          <div>
                            <strong>Status:</strong> {request.status}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Request Details Table */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Details</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {iterationData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs cursor-help break-all">{request.url}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {request.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(request.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatBytes(request.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(request.startTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
