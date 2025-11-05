const fs = require('fs').promises;
const path = require('path');

async function generateReportsData() {
  try {
    const resultsDir = path.join(process.cwd(), 'public', 'results');
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    const indexFilePath = path.join(process.cwd(), 'public', 'reports-index.json');
    
    // Ensure reports directory exists
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Load existing reports index
    let existingIndex = [];
    try {
      const existingData = await fs.readFile(indexFilePath, 'utf8');
      existingIndex = JSON.parse(existingData);
      console.log(`Found ${existingIndex.length} existing reports in index`);
    } catch {
      console.log('No existing reports index found, starting fresh');
    }
    
    // Check if results directory exists
    try {
      await fs.access(resultsDir);
    } catch {
      console.log('Results directory not found, keeping existing reports only');
      await fs.writeFile(indexFilePath, JSON.stringify(existingIndex, null, 2));
      return;
    }

    const files = await fs.readdir(resultsDir);
    const filteredFiles = files.filter((file) => file.endsWith('.json'));
    
    console.log('Processing new report files:', filteredFiles);
    
    // Process new reports
    const newReports = [];
    for (const file of filteredFiles) {
      const content = await fs.readFile(path.join(resultsDir, file), 'utf8');
      const reportData = JSON.parse(content);
      
      const reportName = file.replace('.json', '');
      const reportType = file.startsWith('performance-results-') ? 'performance' : 'network';
      
      // Save individual report file
      const reportFileName = `${reportName}.json`;
      await fs.writeFile(
        path.join(reportsDir, reportFileName),
        JSON.stringify(reportData, null, 2)
      );
      
      // Add to new reports list
      newReports.push({
        name: reportName,
        type: reportType,
        timestamp: reportData.timestamp || new Date().toISOString(),
        file: reportFileName,
        size: JSON.stringify(reportData).length
      });
    }

    // Create a map of existing reports by name for deduplication
    const existingReportsMap = new Map();
    existingIndex.forEach(report => {
      existingReportsMap.set(report.name, report);
    });

    // Add new reports, replacing any with the same name (in case of re-runs)
    newReports.forEach(report => {
      existingReportsMap.set(report.name, report);
    });

    // Convert back to array and sort by timestamp (newest first)
    const allReports = Array.from(existingReportsMap.values()).sort((a, b) => {
      const timestampA = a.timestamp || '0';
      const timestampB = b.timestamp || '0';
      return timestampB.localeCompare(timestampA);
    });

    // Write the reports index
    await fs.writeFile(indexFilePath, JSON.stringify(allReports, null, 2));
    
    // Also create a legacy reports.json for backward compatibility (last 50 reports with full data)
    const recentReports = allReports.slice(0, 50);
    const legacyReports = [];
    
    for (const reportMeta of recentReports) {
      try {
        const reportContent = await fs.readFile(
          path.join(reportsDir, reportMeta.file),
          'utf8'
        );
        legacyReports.push({
          name: reportMeta.name,
          content: JSON.parse(reportContent),
          type: reportMeta.type
        });
      } catch (error) {
        console.warn(`Could not load report file ${reportMeta.file}:`, error.message);
      }
    }
    
    await fs.writeFile(
      path.join(process.cwd(), 'public', 'reports.json'),
      JSON.stringify(legacyReports, null, 2)
    );
    
    console.log(`✅ Generated optimized reports structure:`);
    console.log(`   📊 Total reports: ${allReports.length}`);
    console.log(`   📁 Individual files: ${allReports.length}`);
    console.log(`   📋 Index file: reports-index.json`);
    console.log(`   🔄 Legacy file: reports.json (last ${legacyReports.length} reports)`);
    console.log(`   💾 Storage saved: ~${Math.round((1 - (50 / Math.max(allReports.length, 1))) * 100)}% reduction in main file size`);
    
  } catch (error) {
    console.error('Error generating reports data:', error);
    process.exit(1);
  }
}

generateReportsData();
