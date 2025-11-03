import React from 'react';

type Props = {
  error: string;
  refreshReports: () => void;
};

export const Error: React.FC<Props> = ({ error, refreshReports }) => {
  return (
    <div className="min-h-screen w-full absolute top-0 left-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-red-600 ">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={refreshReports}>
          Try Again
        </button>
      </div>
    </div>
  );
};
