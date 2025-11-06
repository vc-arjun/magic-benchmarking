const fs = require('fs').promises;
const path = require('path');

async function generateReportsData() {
  try {
    const resultsDir = path.join(process.cwd(), 'public', 'results');
    const reportsFilePath = path.join(process.cwd(), 'public', 'reports.json');

    // Load existing reports (downloaded by workflow)
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
    const filteredFiles = files
      .filter((file) => file.endsWith('.json'))
      .sort((a, b) => {
        // Prioritize final consolidated files from parallel execution
        if (a.includes('final') && !b.includes('final')) return -1;
        if (!a.includes('final') && b.includes('final')) return 1;
        return b.localeCompare(a); // Most recent first
      });

    console.log('Processing new report files:', filteredFiles);
    console.log(
      'Final consolidated files found:',
      filteredFiles.filter((f) => f.includes('final'))
    );

    // Process new reports
    const newReports = [];
    for (const file of filteredFiles) {
      const content = await fs.readFile(path.join(resultsDir, file), 'utf8');
      const reportData = JSON.parse(content);

      const reportName = file.replace('.json', '');
      const reportType = file.startsWith('performance-results-') ? 'performance' : 'network';

      // Add to new reports list (simple format matching workflow)
      newReports.push({
        name: reportName,
        type: reportType,
        content: reportData,
      });
    }

    // Create a map of existing reports by name for deduplication
    const existingReportsMap = new Map();
    existingReports.forEach((report) => {
      existingReportsMap.set(report.name, report);
    });

    // Add new reports, replacing any with the same name (in case of re-runs)
    newReports.forEach((report) => {
      existingReportsMap.set(report.name, report);
    });

    // Convert back to array and sort by timestamp (newest first)
    const allReports = Array.from(existingReportsMap.values()).sort((a, b) => {
      const timestampA = a.content.timestamp || '0';
      const timestampB = b.content.timestamp || '0';
      return timestampB.localeCompare(timestampA);
    });

    // Write the unified reports.json file
    await fs.writeFile(reportsFilePath, JSON.stringify(allReports, null, 2));

    console.log(`✅ Generated reports structure:`);
    console.log(
      `   📊 Total reports: ${allReports.length} (${existingReports.length} existing + ${newReports.length} new)`
    );
    console.log(`   📄 Single file: reports.json`);
    console.log(`   💾 File size: ${Math.round(JSON.stringify(allReports).length / 1024)} KB`);
  } catch (error) {
    console.error('Error generating reports data:', error);
    process.exit(1);
  }
}

generateReportsData();
