import { ReportFile } from '@/types/reports';
import { useState, useEffect, useCallback } from 'react';

export const useReports = () => {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    try {
      setLoading(true);
      // For static export, fetch from pre-generated JSON file
      // Use relative path that works with GitHub Pages base path
      const basePath = process.env.NODE_ENV === 'production' ? '/magic-benchmarking' : '';
      const response = await fetch(`${basePath}/reports.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  return { reports, loading, error, refreshReports };
};
