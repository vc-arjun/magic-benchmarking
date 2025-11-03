export const PerformanceCharts = ({
    data,
    originalData,
  }: {
    data: any[];
    originalData: PerformanceData;
  }) => {
    const metricKeys = Object.keys(originalData.metrics_metadata);
  
    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Load Time</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data.length > 0
                    ? Math.round(
                        data.reduce((acc, item) => acc + (item.total_load_time || 0), 0) / data.length
                      )
                    : 0}
                  ms
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Cpu className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Test Conditions</p>
                <p className="text-2xl font-bold text-gray-800">{data.length}</p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Wifi className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Network Types</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(data.map((item) => item.network)).size}
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Iterations</p>
                <p className="text-2xl font-bold text-gray-800">
                  {originalData.execution_config.iterations}
                </p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Performance Metrics Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="context" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              {metricKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
  
        {/* Individual Metric Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {metricKeys.map((metricKey, index) => (
            <div key={metricKey} className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {originalData.metrics_metadata[metricKey].name}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {originalData.metrics_metadata[metricKey].description}
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="context" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={metricKey}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  };