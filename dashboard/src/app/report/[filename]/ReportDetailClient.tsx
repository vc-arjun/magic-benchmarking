'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, Globe } from 'lucide-react';
import { useReports } from '@/app/hooks/useReports';
import { Loading } from '@/components/Loading';
import { Error } from '@/components/Error';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import { NetworkCharts } from '@/components/NetworkCharts';
import { timeToReadable } from '@/utils';
import { BenchmarkResults, NetworkAnalysisReport } from '@/types/reports';

interface ReportDetailClientProps {
  filename: string;
}

const ReportDetailClient = ({ filename }: ReportDetailClientProps) => {
  const decodedFilename = decodeURIComponent(filename);
  const { reports, loading, error, refreshReports } = useReports();

  const report = reports.find((report) => report.name === decodedFilename);

  if (loading) {
    return <Loading />;
  }

  if (error || !report) {
    return <Error error={error || 'Report not found'} refreshReports={refreshReports} />;
  }

  return (
    <div className="grid grid-rows-[1fr,8fr] max-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                {report.type === 'performance' ? (
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                ) : (
                  <Globe className="w-8 h-8 text-purple-600" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {report?.type === 'performance'
                      ? 'Performance Report'
                      : 'Magic Checkout | Network Analysis Report'}
                  </h1>
                  <p className="text-gray-600">{timeToReadable(report.content.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full">
        {report.type === 'performance' ? (
          <PerformanceCharts data={report.content as BenchmarkResults} />
        ) : (
          <NetworkCharts data={report.content as NetworkAnalysisReport} />
        )}
      </div>
    </div>
  );
};

export default ReportDetailClient;
