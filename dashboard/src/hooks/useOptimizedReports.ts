/**
 * Optimized reports hook with caching and performance improvements
 */

import { ReportFile } from '@/types/reports';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Cache for reports data
 */
const reportsCache = new Map<string, { data: ReportFile[]; timestamp: number }>();
const reportCache = new Map<string, { data: ReportFile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Debounce utility (currently unused but available for future use)
 */
// function useDebounce<T>(value: T, delay: number): T {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// }

/**
 * Optimized reports hook with caching, debouncing, and error recovery
 */
export const useOptimizedReports = () => {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = reportsCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_TTL;
  }, []);

  /**
   * Fetch reports with caching and error handling
   */
  const fetchReports = useCallback(
    async (force = false) => {
      const cacheKey = 'reports_list';

      // Check cache first (unless forced)
      if (!force && isCacheValid(cacheKey)) {
        const cached = reportsCache.get(cacheKey);
        if (cached) {
          setReports(cached.data);
          setError(null);
          return cached.data;
        }
      }

      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/reports', {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': force ? 'no-cache' : 'max-age=300', // 5 minutes cache
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ReportFile[] = await response.json();

        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected array');
        }

        // Cache the results
        reportsCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });

        setReports(data);
        setLastFetch(Date.now());
        return data;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't update state
          return reports;
        }

        console.error('Error fetching reports:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load reports';
        setError(errorMessage);

        // Try to use cached data as fallback
        const cached = reportsCache.get(cacheKey);
        if (cached) {
          console.warn('Using cached data due to fetch error');
          setReports(cached.data);
          return cached.data;
        }

        throw error;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isCacheValid, reports]
  );

  /**
   * Debounced refresh function (currently unused but available for future use)
   */
  // const debouncedRefresh = useCallback(
  //   useDebounce(() => fetchReports(true), 300),
  //   [fetchReports]
  // );

  /**
   * Refresh reports (force fetch)
   */
  const refreshReports = useCallback(async () => {
    try {
      await fetchReports(true);
    } catch {
      // Error is already handled in fetchReports
    }
  }, [fetchReports]);

  /**
   * Auto-refresh when component mounts or when cache expires
   */
  useEffect(() => {
    fetchReports();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReports]);

  /**
   * Memoized sorted reports
   */
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const timestampA = new Date(a.content.timestamp).getTime();
      const timestampB = new Date(b.content.timestamp).getTime();
      return timestampB - timestampA; // Descending order (latest first)
    });
  }, [reports]);

  /**
   * Memoized filtered reports by type
   */
  const reportsByType = useMemo(() => {
    const performance = sortedReports.filter((item) => item.type === 'performance');
    const network = sortedReports.filter((item) => item.type === 'network');

    return { performance, network };
  }, [sortedReports]);

  /**
   * Cache statistics
   */
  const cacheStats = useMemo(() => {
    const cacheKey = 'reports_list';
    const cached = reportsCache.get(cacheKey);

    return {
      isCached: !!cached,
      cacheAge: cached ? Date.now() - cached.timestamp : 0,
      isExpired: cached ? Date.now() - cached.timestamp > CACHE_TTL : true,
      lastFetch,
    };
  }, [lastFetch]);

  /**
   * Auto-refresh interval (every 5 minutes if not actively loading)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && Date.now() - lastFetch > CACHE_TTL) {
        fetchReports();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [loading, lastFetch, fetchReports]);

  return {
    reports: sortedReports,
    performanceReports: reportsByType.performance,
    networkReports: reportsByType.network,
    loading,
    error,
    refreshReports,
    cacheStats,

    // Additional utilities
    totalReports: sortedReports.length,
    hasReports: sortedReports.length > 0,
    lastUpdated: lastFetch ? new Date(lastFetch).toLocaleString() : null,
  };
};

/**
 * Hook for individual report data with caching
 */
export const useOptimizedReport = (filename: string) => {
  const [reportData, setReportData] = useState<ReportFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!filename) return;

    const cacheKey = `report_${filename}`;

    // Check cache first
    const cached = reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setReportData(cached.data);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${encodeURIComponent(filename)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }

      const data: ReportFile = await response.json();

      // Cache the result
      reportCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    reportData,
    loading,
    error,
    refetch: fetchReport,
  };
};

/**
 * Clear all reports cache
 */
export const clearReportsCache = () => {
  reportsCache.clear();
  reportCache.clear();
};
