export const NetworkCharts = ({ data, originalData }: { data: any[]; originalData: NetworkResults }) => {
    const requestTypes = originalData.results.map((result) => result.context.network);
  
    // Aggregate data for pie chart
    const pieData = requestTypes.map((type) => ({
      name: type,
      value: data
        .filter((item) => item.requestType === type)
        .reduce((acc, item) => acc + item.count, 0),
      avgDuration:
        data
          .filter((item) => item.requestType === type)
          .reduce((acc, item) => acc + item.avgDuration, 0) /
        data.filter((item) => item.requestType === type).length,
    }));
  
    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Network className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data.reduce((acc, item) => acc + item.count, 0)}
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Math.round(data.reduce((acc, item) => acc + item.avgDuration, 0) / data.length)}ms
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <Download className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Math.round(data.reduce((acc, item) => acc + item.totalSize, 0) / 1024)}KB
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Request Types</p>
                <p className="text-2xl font-bold text-gray-800">{requestTypes.length}</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Request Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
  
          {/* Request Duration by Type */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Average Duration by Request Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDuration" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
  
        {/* Request Count by Context */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Request Count by Test Condition</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="context" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="count" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };