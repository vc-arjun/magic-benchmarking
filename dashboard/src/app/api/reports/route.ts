import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import { ReportFile } from '@/types/reports';

export const GET = async () => {
  try {
    const files = await fs.readdir(path.join(process.cwd(), 'public', 'results'));
    const filteredFiles = files.filter((file) => file.endsWith('.json'));
    const response: ReportFile[] = await Promise.all(
      filteredFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(process.cwd(), 'public', 'results', file),
          'utf8'
        );
        return {
          name: file.replace('.json', ''),
          content: JSON.parse(content),
          type: file.startsWith('performance-results-') ? 'performance' : 'network',
        };
      })
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
};
