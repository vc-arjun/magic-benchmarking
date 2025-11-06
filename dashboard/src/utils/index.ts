import { ReportFile, BenchmarkResults, NetworkAnalysisReport } from '@/types/reports';

export const timeToReadable = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const hour = date.getHours();
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  // Add ordinal suffix to day
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${month} ${year}, ${displayHour}${period}`;
};

/**
 * Download a file with the given content and filename
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'application/json'
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download a single report as JSON
 */
export const downloadReportAsJSON = (report: ReportFile) => {
  const timestamp = new Date(report.content.timestamp).toISOString().split('T')[0];
  const filename = `${report.type}-report-${timestamp}.json`;
  const content = JSON.stringify(report.content, null, 2);
  downloadFile(content, filename, 'application/json');
};

/**
 * Download multiple reports as a single JSON file
 */
export const downloadAllReportsAsJSON = (reports: ReportFile[]) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `all-reports-${timestamp}.json`;
  const content = JSON.stringify(reports, null, 2);
  downloadFile(content, filename, 'application/json');
};

/**
 * Convert performance report to CSV format
 */
export const convertPerformanceReportToCSV = (report: BenchmarkResults): string => {
  const rows: string[] = [];

  // CSV Header
  rows.push(
    'Product,Network,CPU,User State,Browser,Metric,Iteration,Value,Unit,Min,Max,Mean,Count'
  );

  // Data rows
  for (const product of report.products) {
    for (const result of product.results) {
      const { context } = result;
      for (const [metricName, metricData] of Object.entries(result.metrics)) {
        for (const measurement of metricData.measurements) {
          rows.push(
            [
              product.product,
              context.network,
              context.cpu,
              context.user_state,
              context.browser,
              metricName,
              measurement.iteration.toString(),
              measurement.value.toString(),
              measurement.unit,
              metricData.statistics.min.toString(),
              metricData.statistics.max.toString(),
              metricData.statistics.mean.toString(),
              metricData.statistics.count.toString(),
            ].join(',')
          );
        }
      }
    }
  }

  return rows.join('\n');
};

/**
 * Convert network report to CSV format
 */
export const convertNetworkReportToCSV = (report: NetworkAnalysisReport): string => {
  const rows: string[] = [];

  // CSV Header
  rows.push(
    'Product,Network,CPU,User State,Browser,Request Type,URL,Method,Iteration,Status,Duration,Size,Start Time,End Time'
  );

  // Data rows
  for (const product of report.products) {
    for (const result of product.results) {
      const { context } = result;
      for (const request of result.requests) {
        // Each request has multiple measurements (iterations)
        for (const measurement of request.measurements) {
          rows.push(
            [
              product.product,
              context.network,
              context.cpu,
              context.user_state,
              context.browser,
              request.type,
              `"${request.url}"`, // Quote URLs to handle commas
              request.method,
              measurement.iteration.toString(),
              measurement.status.toString(),
              measurement.duration.toString(),
              measurement.size.toString(),
              measurement.startTime.toString(),
              measurement.endTime.toString(),
            ].join(',')
          );
        }
      }
    }
  }

  return rows.join('\n');
};

/**
 * Download a single report as CSV
 */
export const downloadReportAsCSV = (report: ReportFile) => {
  const timestamp = new Date(report.content.timestamp).toISOString().split('T')[0];
  const filename = `${report.type}-report-${timestamp}.csv`;

  let csvContent: string;
  if (report.type === 'performance') {
    csvContent = convertPerformanceReportToCSV(report.content as BenchmarkResults);
  } else {
    csvContent = convertNetworkReportToCSV(report.content as NetworkAnalysisReport);
  }

  downloadFile(csvContent, filename, 'text/csv');
};

/**
 * Download all reports as separate CSV files (zipped would be ideal, but for simplicity we'll download separately)
 */
export const downloadAllReportsAsCSV = (reports: ReportFile[]) => {
  reports.forEach((report, index) => {
    // Add a small delay between downloads to avoid browser blocking
    setTimeout(() => {
      downloadReportAsCSV(report);
    }, index * 100);
  });
};
