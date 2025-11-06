import { ReportFile } from '@/types/reports';
import { timeToReadable } from '@/utils';
import { BarChart3, Globe, FileText, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';

type Props = {
  report: ReportFile;
};

export const ReportCard: React.FC<Props> = ({ report }) => {
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadClick = (e: React.MouseEvent, downloadFn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    downloadFn();
    setDownloadDropdownOpen(false);
  };

  const handleDownloadButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloadDropdownOpen(!downloadDropdownOpen);
  };

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 border border-gray-100">
      <Link
        href={`/report/${encodeURIComponent(report.name)}`}
        className="flex items-center gap-4 p-6 cursor-pointer"
      >
        {report.type === 'performance' ? (
          <BarChart3 className="w-6 h-6 text-gray-600" />
        ) : (
          <Globe className="w-6 h-6 text-gray-600" />
        )}
        <p className="text-md text-gray-900 font-medium flex-1">
          {timeToReadable(report.content.timestamp)}
        </p>
      </Link>
    </div>
  );
};
