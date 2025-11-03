import { Activity } from 'lucide-react';
import React from 'react';

export const Loading = () => {
  return (
    <div className="min-h-screen w-full absolute top-0 left-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="relative ">
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-600 ">Loading Dashboard</h2>
        </div>
      </div>
    </div>
  );
};
