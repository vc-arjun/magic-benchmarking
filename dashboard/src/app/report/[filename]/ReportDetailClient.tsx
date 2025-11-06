'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BarChart3, Globe, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useReports } from '@/app/hooks/useReports';
import { Loading } from '@/components/Loading';
import { Error } from '@/components/Error';
import { PerformanceCharts } from '@/components/PerformanceCharts';
import { NetworkCharts } from '@/components/NetworkCharts';
import { timeToReadable, downloadReportAsJSON, downloadReportAsCSV } from '@/utils';
import { BenchmarkResults, NetworkAnalysisReport } from '@/types/reports';

interface ReportDetailClientProps {
  filename: string;
}

const ReportDetailClient = ({ filename }: ReportDetailClientProps) => {
  const decodedFilename = decodeURIComponent(filename);
  const { reports, loading, error, refreshReports } = useReports();
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const report = reports.find((report) => report.name === decodedFilename);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDownloadDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

            {/* Download Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              {downloadDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-10">
                  <button
                    onClick={() => {
                      downloadReportAsJSON(report);
                      setDownloadDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>JSON Format</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadReportAsCSV(report);
                      setDownloadDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>CSV Format</span>
                  </button>
                </div>
              )}
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
