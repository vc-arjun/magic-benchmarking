import { readFileSync } from 'fs';
import ReportDetailClient from './ReportDetailClient';
import { ReportFile } from '@/types/reports';

// Generate static params from actual report files
export async function generateStaticParams() {
  try {
    const reports = readFileSync('public/reports.json', 'utf8');
    const data = JSON.parse(reports);
    return data.map((report: ReportFile) => ({
      filename: report.name,
    })); 
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

const ReportDetail = ({ params }: { params: { filename: string } }) => {
  return <ReportDetailClient filename={params.filename} />;
};

export default ReportDetail;
