import React, { useState } from 'react';
import { WaterfallDataPoint } from './types';
import { formatDuration, formatBytes } from './utils';

interface Props {
  data: WaterfallDataPoint[];
  availableIterations: number[];
}

export const NetworkWaterfallChart: React.FC<Props> = ({ data, availableIterations }) => {
  const [selectedIteration, setSelectedIteration] = useState(availableIterations[0] || 1);
  const [hoveredRequest, setHoveredRequest] = useState<string | null>(null);

  // Filter data for selected iteration
  const iterationData = data.filter(d => d.iteration === selectedIteration);

  // Calculate chart dimensions
  const minStartTime = Math.min(...iterationData.map(d => d.startTime));
  const maxEndTime = Math.max(...iterationData.map(d => d.endTime));
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
  const requestTypes = [...new Set(iterationData.map(d => d.type))];

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Iteration:
            <select
              value={selectedIteration}
              onChange={(e) => setSelectedIteration(parseInt(e.target.value))}
              className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {availableIterations.map(iteration => (
                <option key={iteration} value={iteration}>
                  {iteration}
                </option>
              ))}
            </select>
          </label>
          
          <div className="text-sm text-gray-600">
            Total Duration: {formatDuration(totalDuration)}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Request Types:</span>
          {requestTypes.map(type => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ 
                  backgroundColor: iterationData.find(d => d.type === type)?.color || '#666666' 
                }}
              />
              <span className="text-xs text-gray-600">{type.toUpperCase()}</span>
            </div>
          ))}
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
                  <div className="w-80 px-3 py-2 text-xs text-gray-700 truncate border-r border-gray-200">
                    <div className="font-medium">{request.shortUrl}</div>
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
                        className="absolute z-10 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none"
                        style={{
                          left: `${(xPosition / chartWidth) * 100}%`,
                          top: -30,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div>Duration: {formatDuration(request.duration)}</div>
                        <div>Size: {formatBytes(request.size)}</div>
                        <div>Status: {request.status}</div>
                        <div>Start: {formatDuration(request.startTime)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-blue-900">Total Requests</div>
          <div className="text-2xl font-bold text-blue-700">{iterationData.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-green-900">Total Duration</div>
          <div className="text-2xl font-bold text-green-700">{formatDuration(totalDuration)}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-purple-900">Avg Duration</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatDuration(iterationData.reduce((sum, req) => sum + req.duration, 0) / iterationData.length)}
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-900">Total Size</div>
          <div className="text-2xl font-bold text-orange-700">
            {formatBytes(iterationData.reduce((sum, req) => sum + req.size, 0))}
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {iterationData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={request.url}>
                        {request.shortUrl}
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status >= 200 && request.status < 300
                          ? 'bg-green-100 text-green-800'
                          : request.status >= 300 && request.status < 400
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
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
