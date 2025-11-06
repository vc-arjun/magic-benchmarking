import { ReportFile } from '@/types/reports';
import { timeToReadable, downloadReportAsJSON, downloadReportAsCSV } from '@/utils';
import { BarChart3, Globe, Download, FileText, FileSpreadsheet } from 'lucide-react';
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

      {/* Download Button */}
      <div className="absolute top-4 right-4" ref={dropdownRef}>
        <button
          onClick={handleDownloadButtonClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
          title="Download report"
        >
          <Download className="w-4 h-4" />
        </button>

        {downloadDropdownOpen && (
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[140px] z-20">
            <button
              onClick={(e) => handleDownloadClick(e, () => downloadReportAsJSON(report))}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-sm"
            >
              <FileText className="w-3 h-3" />
              <span>JSON</span>
            </button>
            <button
              onClick={(e) => handleDownloadClick(e, () => downloadReportAsCSV(report))}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-sm"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
