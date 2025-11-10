'use client';

import React, { useState } from 'react';
import { Lock, Key, AlertCircle } from 'lucide-react';

interface AuthGateProps {
  onAuthenticate: (key: string) => boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticate }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsSubmitting(true);

    // Small delay for better UX
    setTimeout(() => {
      const success = onAuthenticate(key);
      if (!success) {
        setError(true);
        setKey('');
      }
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Authentication Required
            </h1>
            <p className="text-gray-600">
              Please enter your access key to view the dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="auth-key" className="block text-sm font-semibold text-gray-700 mb-2">
                Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="auth-key"
                  type="password"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError(false);
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                  placeholder="Enter your access key"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid access key. Please try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !key}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                isSubmitting || !key
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Authenticating...
                </span>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Access restricted to authorized users only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

