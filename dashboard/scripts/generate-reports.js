const fs = require('fs').promises;
const path = require('path');

async function generateReportsData() {
  try {
    const resultsDir = path.join(process.cwd(), 'public', 'results');
    
    // Check if results directory exists
    try {
      await fs.access(resultsDir);
    } catch {
      console.log('Results directory not found, creating empty reports data');
      const emptyData = [];
      await fs.writeFile(
        path.join(process.cwd(), 'public', 'reports-data.json'),
        JSON.stringify(emptyData, null, 2)
      );
      return;
    }

    const files = await fs.readdir(resultsDir);
    const filteredFiles = files.filter((file) => file.endsWith('.json'));
    
    console.log('Generating reports data for files:', filteredFiles);
    
    const reportsData = await Promise.all(
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

    // Write the reports data to public directory
    await fs.writeFile(
      path.join(process.cwd(), 'public', 'reports.json'),
      JSON.stringify(reportsData, null, 2)
    );
    
    console.log(`Generated reports data with ${reportsData.length} reports`);
  } catch (error) {
    console.error('Error generating reports data:', error);
    process.exit(1);
  }
}

generateReportsData();
