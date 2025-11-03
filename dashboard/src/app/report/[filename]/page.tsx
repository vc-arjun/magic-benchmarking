'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Filter,
  BarChart3,
  Network,
  Clock,
  Cpu,
  Wifi,
  User,
  Download,
  GitCompare,
} from 'lucide-react';
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
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useReports } from '@/app/hooks/useReports';
import { Loading } from '@/components/Loading';
import { Error } from '@/components/Error';
import { timeToReadable } from '@/utils';
import { BenchmarkResults, NetworkAnalysis, NetworkResults } from '@/types/reports';

const COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#6366F1',
  '#EC4899',
  '#14B8A6',
];

const ReportDetail = () => {
  const params = useParams();
  const router = useRouter();
  const filename = decodeURIComponent(params.filename as string);

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const { reports, loading, error, refreshReports } = useReports();

  const report = reports.find((report) => report.name === filename);
  const performanceReports = reports.filter((report) => report.type === 'performance');
  const networkReports = reports.filter((report) => report.type === 'network');

  const processPerformanceData = (data: PerformanceData) => {
    const processedData: any[] = [];

    data.products.forEach((product) => {
      product.results.forEach((result: any) => {
        const contextLabel = `${result.context.network} / ${result.context.cpu}`;
        const dataPoint: any = {
          context: contextLabel,
          network: result.context.network,
          cpu: result.context.cpu,
        };

        Object.keys(result.metrics).forEach((metricKey) => {
          dataPoint[metricKey] = result.metrics[metricKey].statistics.mean;
        });

        processedData.push(dataPoint);
      });
    });

    setChartData(processedData);
  };

  const processNetworkData = (data: NetworkData) => {
    const processedData: any[] = [];

    data.products.forEach((product) => {
      product.results.forEach((result: any) => {
        const contextLabel = `${result.context.network} / ${result.context.cpu}`;

        // Aggregate request data by type
        const requestsByType: {
          [key: string]: { count: number; totalDuration: number; totalSize: number };
        } = {};

        result.requests.forEach((request: any) => {
          if (!requestsByType[request.type]) {
            requestsByType[request.type] = { count: 0, totalDuration: 0, totalSize: 0 };
          }
          requestsByType[request.type].count += 1;
          requestsByType[request.type].totalDuration += request.statistics.mean;
          requestsByType[request.type].totalSize += request.measurements[0]?.size || 0;
        });

        Object.keys(requestsByType).forEach((type) => {
          processedData.push({
            context: contextLabel,
            network: result.context.network,
            cpu: result.context.cpu,
            requestType: type,
            count: requestsByType[type].count,
            avgDuration: requestsByType[type].totalDuration / requestsByType[type].count,
            totalSize: requestsByType[type].totalSize,
          });
        });
      });
    });

    setChartData(processedData);
  };

  const getFilteredData = () => {
    if (selectedFilter === 'all') return chartData;
    return chartData.filter(
      (item) =>
        item.network === selectedFilter ||
        item.cpu === selectedFilter ||
        item.requestType === selectedFilter
    );
  };

  const getUniqueFilters = () => {
    const filters = new Set<string>();
    chartData.forEach((item) => {
      if (item.network) filters.add(item.network);
      if (item.cpu) filters.add(item.cpu);
      if (item.requestType) filters.add(item.requestType);
    });
    return Array.from(filters);
  };

  const getAvailableReports = () => {
    const reports = report?.type === 'performance' ? performanceReports : networkReports;
    return reports.filter((report) => report.name !== filename);
  };

  const handleCompareWith = (compareFilename: string) => {
    router.push(`/compare?type=${report?.type}&report1=${filename}&report2=${compareFilename}`);
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !report) {
    return <Error error={error || 'Report not found'} refreshReports={refreshReports} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                {report.type === 'performance' ? (
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                ) : (
                  <Network className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {report?.type === 'performance' ? 'Performance Report' : 'Network Analysis Report'}
                  </h1>
                  <p className="text-gray-600">{new Date(report.content.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Conditions</option>
                  {getUniqueFilters().map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowCompareModal(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                disabled={getAvailableReports().length === 0}
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare</span>
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {report.type === 'performance' ? (
          <PerformanceCharts data={getFilteredData()} originalData={report.content as BenchmarkResults} />
        ) : (
          <NetworkCharts data={getFilteredData()} originalData={report.content as NetworkResults} />
        )}
      </div>

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Compare with Another Report</h3>
            <p className="text-gray-600 mb-6">Select a report to compare with the current one:</p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {getAvailableReports().map((report, index) => (
                <button
                  key={index}
                  onClick={() => handleCompareWith(report.name)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">{timeToReadable(report.name)}</div>
                  <div className="text-sm text-gray-600">{report.name}</div>
                </button>
              ))}
            </div>

            {getAvailableReports().length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No other reports available for comparison
              </p>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





export default ReportDetail;
