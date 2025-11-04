const fs = require('fs').promises;
const path = require('path');

async function generateReportsData() {
  try {
    const resultsDir = path.join(process.cwd(), 'public', 'results');
    const reportsFilePath = path.join(process.cwd(), 'public', 'reports.json');
    
    // Load existing reports data
    let existingReports = [];
    try {
      const existingData = await fs.readFile(reportsFilePath, 'utf8');
      existingReports = JSON.parse(existingData);
      console.log(`Found ${existingReports.length} existing reports`);
    } catch {
      console.log('No existing reports found, starting fresh');
    }
    
    // Check if results directory exists
    try {
      await fs.access(resultsDir);
    } catch {
      console.log('Results directory not found, keeping existing reports only');
      await fs.writeFile(reportsFilePath, JSON.stringify(existingReports, null, 2));
      return;
    }

    const files = await fs.readdir(resultsDir);
    const filteredFiles = files.filter((file) => file.endsWith('.json'));
    
    console.log('Processing new report files:', filteredFiles);
    
    // Process new reports
    const newReports = await Promise.all(
      filteredFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(resultsDir, file),
          'utf8'
        );
        return {
          name: file.replace('.json', ''),
          content: JSON.parse(content),
          type: file.startsWith('performance-results-') ? 'performance' : 'network',
        };
      })
    );

    // Create a map of existing reports by name for deduplication
    const existingReportsMap = new Map();
    existingReports.forEach(report => {
      existingReportsMap.set(report.name, report);
    });

    // Add new reports, replacing any with the same name (in case of re-runs)
    newReports.forEach(report => {
      existingReportsMap.set(report.name, report);
    });

    // Convert back to array and sort by timestamp (newest first)
    const allReports = Array.from(existingReportsMap.values()).sort((a, b) => {
      const timestampA = a.content.timestamp || '0';
      const timestampB = b.content.timestamp || '0';
      return timestampB.localeCompare(timestampA);
    });

    // Write the combined reports data
    await fs.writeFile(reportsFilePath, JSON.stringify(allReports, null, 2));
    
    console.log(`✅ Generated reports data with ${allReports.length} total reports (${newReports.length} new, ${existingReports.length} existing)`);
  } catch (error) {
    console.error('Error generating reports data:', error);
    process.exit(1);
  }
}

generateReportsData();
