'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full shadow-2xl animate-pulse">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Error Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h1 className="text-4xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Oops! Something went wrong
          </h1>

          <p className="text-xl text-gray-700 mb-6 leading-relaxed">
            We encountered an unexpected error while loading the dashboard. Don&apos;t worry, our
            team has been notified.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Error Details (Development Only):
              </h3>
              <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={reset}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-semibold">Try Again</span>
            </button>

            <Link
              href="/"
              className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border border-gray-200"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Go to Dashboard</span>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              If this problem persists, please{' '}
              <button
                onClick={() => window.location.reload()}
                className="text-red-600 hover:text-red-700 font-medium underline"
              >
                refresh the page
              </button>{' '}
              or contact support.
            </p>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="mt-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
