import { ReportFile } from '@/types/reports';
import { timeToReadable } from '@/utils';
import { BarChart3, Globe, Network } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type Props = {
  report: ReportFile;
};

export const ReportCard: React.FC<Props> = ({ report }) => (
  <Link
    href={`/report/${encodeURIComponent(report.name)}`}
    className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 cursor-pointer p-6 border border-gray-100 flex items-center gap-4"
  >
    {report.type === 'performance' ? (
      <BarChart3 className="w-6 h-6 text-gray-600" />
    ) : (
      <Globe className="w-6 h-6 text-gray-600" />
    )}
    <p className="text-md text-gray-900 font-medium">
      {timeToReadable(report.content.timestamp)}
    </p>
  </Link>
);
