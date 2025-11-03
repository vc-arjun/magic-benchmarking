'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Home, FileX, BarChart3 } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* 404 Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl">
              <FileX className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* 404 Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="mb-6">
            <h1 className="text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              404
            </h1>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          </div>

          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s
            get you back to analyzing your performance data!
          </p>

          {/* Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              What you can do:
            </h3>
            <ul className="text-left text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Check the URL for any typos
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Go back to the dashboard to view your reports
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Use the search or navigation to find what you need
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Go to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 italic">
            💡 Fun fact: 404 errors are named after room 404 at CERN where the first web server was
            located!
          </p>
        </div>
      </div>
    </div>
  );
}
