'use client';

import React from 'react';
import { BarChart3, RefreshCw, Clock, Activity, Globe } from 'lucide-react';
import { useReports } from './hooks/useReports';
import { ReportCard } from '@/components/ReportCard';
import { Loading } from '@/components/Loading';
import { Error } from '@/components/Error';

const Dashboard = () => {
  const { reports, loading, error, refreshReports } = useReports();

  const performanceReports = reports.filter((item) => item.type === 'performance');
  const networkReports = reports.filter((item) => item.type === 'network');

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} refreshReports={refreshReports} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="relative z-10 text-center py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Activity className="w-12 h-12 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Performance Dashboard
              </h1>
            </div>
          </div>
          <button
            onClick={refreshReports}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Reports</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Performance Reports</p>
                <p className="text-2xl font-bold text-gray-800">{performanceReports.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Network Reports</p>
                <p className="text-2xl font-bold text-gray-800">{networkReports.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Last Updated</p>
                <p className="text-sm font-bold text-gray-800">
                  {performanceReports.length > 0
                    ? new Date(performanceReports[0].content.timestamp).toLocaleDateString()
                    : 'No data'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Performance Reports Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Performance Reports</h2>
                <p className="text-gray-600 font-medium">Timing metrics and performance analysis</p>
              </div>
            </div>

            <div className="space-y-4">
              {performanceReports.length > 0 ? (
                performanceReports.map((report, index) => (
                  <ReportCard key={index} report={report} />
                ))
              ) : (
                <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Performance Reports</h3>
                  <p className="text-gray-600">
                    Performance reports will appear here once generated
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Network Reports Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Network Reports</h2>
                <p className="text-gray-600 font-medium">Request analysis and network behavior</p>
              </div>
            </div>

            <div className="space-y-4">
              {networkReports.length > 0 ? (
                networkReports.map((report, index) => <ReportCard key={index} report={report} />)
              ) : (
                <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Globe className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Network Reports</h3>
                  <p className="text-gray-600">Network reports will appear here once generated</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
