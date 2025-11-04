import { promises as fs } from 'fs';
import path from 'path';
import ReportDetailClient from './ReportDetailClient';

// Generate static params from actual report files
export async function generateStaticParams() {
  try {
    const resultsDir = path.join(process.cwd(), 'public', 'results');

    // Check if results directory exists
    try {
      await fs.access(resultsDir);
    } catch {
      // Results directory doesn't exist yet, return empty array
      console.log('Results directory not found, generating empty static params');
      return [];
    }

    const files = await fs.readdir(resultsDir);

    // Filter for JSON files (reports)
    const reportFiles = files.filter((file) => file.endsWith('.json'));

    console.log('Found report files for static generation:', reportFiles);

    return reportFiles.map((filename) => ({
      filename: encodeURIComponent(filename.replace('.json', '')),
    }));
  } catch (error) {
    console.warn('Error generating static params:', error);
    return [];
  }
}

const ReportDetail = ({ params }: { params: { filename: string } }) => {
  return <ReportDetailClient filename={params.filename} />;
};

export default ReportDetail;
