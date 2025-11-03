import { ReportFile } from '@/types/reports';
import { useState, useEffect, useCallback } from 'react';

export const useReports = () => {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw await response.json();
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
