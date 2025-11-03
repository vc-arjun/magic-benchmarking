'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Network, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface ComparisonData {
  metric: string;
  report1: number;
  report2: number;
  difference: number;
  percentChange: number;
}

const CompareReportsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [report1Data, setReport1Data] = useState<any>(null);
  const [report2Data, setReport2Data] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  const report1 = searchParams.get('report1');
  const report2 = searchParams.get('report2');
  const type = searchParams.get('type');

  useEffect(() => {
    const loadComparisonData = async () => {
      if (!report1 || !report2 || !type) return;

      try {
        const [response1, response2] = await Promise.all([
          fetch(`/results/${report1}`),
          fetch(`/results/${report2}`)
        ]);

        const [data1, data2] = await Promise.all([
          response1.json(),
          response2.json()
        ]);

        setReport1Data(data1);
        setReport2Data(data2);

        if (type === 'performance') {
          processPerformanceComparison(data1, data2);
        } else {
          processNetworkComparison(data1, data2);
        }
      } catch (error) {
        console.error('Error loading comparison data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComparisonData();
  }, [report1, report2, type]);

  const processPerformanceComparison = (data1: any, data2: any) => {
    const comparison: ComparisonData[] = [];
    
    // Get metrics from first report
    const metrics1 = data1.products[0]?.results[0]?.metrics || {};
    const metrics2 = data2.products[0]?.results[0]?.metrics || {};

    Object.keys(metrics1).forEach(metricKey => {
      if (metrics2[metricKey]) {
        const value1 = metrics1[metricKey].statistics.mean;
        const value2 = metrics2[metricKey].statistics.mean;
        const difference = value2 - value1;
        const percentChange = ((difference / value1) * 100);

        comparison.push({
          metric: metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          report1: value1,
          report2: value2,
          difference,
          percentChange
        });
      }
    });

    setComparisonData(comparison);
  };

  const processNetworkComparison = (data1: any, data2: any) => {
    const comparison: ComparisonData[] = [];
    
    // Aggregate network data for comparison
    const aggregateNetworkData = (data: any) => {
      let totalRequests = 0;
      let totalDuration = 0;
      let totalSize = 0;

      if (data.products) {
        data.products.forEach((product: any) => {
          if (product.results) {
            product.results.forEach((result: any) => {
              if (result.requests) {
                result.requests.forEach((request: any) => {
                  totalRequests += 1;
                  // Use statistics if available, otherwise use duration directly
                  const duration = request.statistics?.mean || request.duration || 0;
                  totalDuration += duration;
                  // Use measurements if available, otherwise use size directly
                  const size = request.measurements?.[0]?.size || request.size || 0;
                  totalSize += size;
                });
              }
            });
          }
        });
      }

      return {
        totalRequests,
        avgDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
        totalSize: totalSize / 1024 // Convert to KB
      };
    };

    const agg1 = aggregateNetworkData(data1);
    const agg2 = aggregateNetworkData(data2);

    const metrics = [
      { key: 'totalRequests', name: 'Total Requests' },
      { key: 'avgDuration', name: 'Average Duration (ms)' },
      { key: 'totalSize', name: 'Total Size (KB)' }
    ];

    metrics.forEach(({ key, name }) => {
      const value1 = agg1[key as keyof typeof agg1];
      const value2 = agg2[key as keyof typeof agg2];
      const difference = value2 - value1;
      const percentChange = ((difference / value1) * 100);

      comparison.push({
        metric: name,
        report1: value1,
        report2: value2,
        difference,
        percentChange
      });
    });

    setComparisonData(comparison);
  };

  const getChangeIcon = (percentChange: number) => {
    if (percentChange > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (percentChange < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (percentChange: number) => {
    if (percentChange > 0) return 'text-red-600';
    if (percentChange < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!report1Data || !report2Data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Reports Not Found</h2>
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                {type === 'performance' ? (
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                ) : (
                  <Network className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Report Comparison</h1>
                  <p className="text-gray-600">
                    {type === 'performance' ? 'Performance Metrics' : 'Network Analysis'} Comparison
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Report Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Report 1</h3>
            <p className="text-sm text-gray-600">{report1}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(report1Data.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Report 2</h3>
            <p className="text-sm text-gray-600">{report2}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(report2Data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Metrics Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Metric</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-800">Report 1</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-800">Report 2</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-800">Difference</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-800">Change</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{item.metric}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.report1.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {item.report2.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${getChangeColor(item.percentChange)}`}>
                      {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${getChangeColor(item.percentChange)}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {getChangeIcon(item.percentChange)}
                        <span>
                          {item.percentChange > 0 ? '+' : ''}{item.percentChange.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Comparison Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Visual Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="report1" fill="#3B82F6" name="Report 1" />
              <Bar dataKey="report2" fill="#8B5CF6" name="Report 2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const CompareReports = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CompareReportsContent />
    </Suspense>
  );
};

export default CompareReports;
