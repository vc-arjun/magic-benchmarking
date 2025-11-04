# Magic Benchmarking Framework

A comprehensive performance benchmarking framework for Magic Checkout using Playwright automation with a Next.js dashboard for visualization and analysis.

## 🎯 Overview

This project provides an end-to-end solution for measuring and analyzing the performance of Magic Checkout against competitors. It automates browser testing, captures detailed performance metrics, monitors network requests, and provides rich visualizations through an interactive dashboard.

### Key Features

- **🚀 Automated Performance Testing**: Uses Playwright to automate browser interactions and measure real-world performance
- **📊 Comprehensive Metrics**: Captures timing metrics, network analysis, and user experience indicators
- **🎨 Interactive Dashboard**: Next.js-powered dashboard with rich visualizations and filtering capabilities
- **🔧 Configurable Test Matrix**: Supports multiple network conditions, CPU throttling, and user states
- **📈 Trend Analysis**: Track performance over time with detailed statistical analysis
- **🛡️ Robust Error Handling**: Comprehensive error handling with retry mechanisms and graceful degradation
- **⚡ Performance Optimized**: Includes caching, memoization, and optimized data processing

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Usage](#usage)
- [Dashboard](#dashboard)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome/Chromium browser (for Playwright)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd magic-benchmarking
   ```

2. **Install dependencies**
   ```bash
   # Install main dependencies
   npm install
   
   # Install dashboard dependencies
   cd dashboard
   npm install
   cd ..
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## ⚡ Quick Start

### Running Performance Tests

1. **Basic execution**
   ```bash
   npm start
   ```

2. **Development mode with live reload**
   ```bash
   npm run dev
   ```

3. **Debug mode with inspector**
   ```bash
   npm run debug
   ```

### Viewing Results

1. **Start the dashboard**
   ```bash
   npm run web:dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000` to view the interactive dashboard.

### Example Output

After running tests, you'll find results in `./dashboard/public/results/`:
- `performance-results-consolidated-{timestamp}.json` - Performance metrics
- `performance-results-consolidated-{timestamp}.csv` - CSV export for analysis
- `network-analysis-{timestamp}.json` - Network request analysis

## 🏗️ Architecture

### Core Components

```
src/
├── config.ts                 # Configuration management
├── executor.ts              # Test execution orchestration
├── performance.ts           # Performance monitoring
├── network-monitor.ts       # Network request tracking
├── results-manager.ts       # Data persistence and export
├── pom/                     # Page Object Models
│   └── magic-checkout.ts    # Magic Checkout automation
├── types/                   # TypeScript definitions
├── constants/               # Application constants
└── utils/                   # Utility functions
    ├── errors.ts            # Error handling
    ├── validation.ts        # Input validation
    ├── common.ts            # Common utilities
    ├── logger.ts            # Structured logging
    └── cache.ts             # Caching mechanisms

dashboard/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # Dashboard type definitions
│   └── utils/               # Dashboard utilities
└── public/
    └── results/             # Generated test results
```

### Data Flow

1. **Configuration Loading**: Validates and loads test configuration
2. **Test Execution**: Runs automated browser tests across different conditions
3. **Data Collection**: Captures performance metrics and network requests
4. **Results Processing**: Aggregates and analyzes collected data
5. **Visualization**: Displays results in interactive dashboard

## ⚙️ Configuration

### Main Configuration (`src/config.ts`)

```typescript
export const CONFIG: Config = {
  products: [
    {
      name: 'MagicCheckout',
      entry_url: 'https://razorpay.com/demopg3/',
      pom_file: 'magic-checkout.ts',
      enabled: true,
    },
  ],
  execution_matrix: {
    network: {
      no_throttling: { /* ... */ },
      slow_4g: { /* ... */ },
    },
    cpu: {
      no_throttling: { rate: 1, enabled: true },
      '4x_slowdown': { rate: 4, enabled: false },
    },
    user_state: {
      new_user: { is_logged_in: false, enabled: true },
    },
  },
  execution: {
    iterations: 20,
    timeout: 120000,
    headless: false,
    browsers: ['chromium'],
    retry: {
      max_attempts: 3,
      delay_between_retries: 3000,
      save_progress_on_failure: true,
    },
  },
  output: {
    formats: ['json', 'csv'],
    directory: './dashboard/public/results',
  },
};
```

### Environment Variables

```bash
# Development/Production mode
NODE_ENV=development

# Logging configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
LOG_FILE_PATH=./logs/app.log

# Test configuration
SILENT_TESTS=true
PLAYWRIGHT_HEADLESS=true
```

## 📖 Usage

### Basic Usage

```typescript
import { TestExecutor } from './src/executor';
import { CONFIG } from './src/config';

// Create executor for a product
const executor = new TestExecutor(CONFIG.products[0]);

// Run tests
await executor.run();

// Get results
const results = executor.getResults();
const networkResults = executor.getNetworkResults();
```

### Custom Configuration

```typescript
import { ValidationUtils } from './src/utils';

// Create custom config
const customConfig = {
  // ... your configuration
};

// Validate configuration
const validatedConfig = ValidationUtils.validateConfig(customConfig);
```

### Error Handling

```typescript
import { ErrorHandler, BrowserError } from './src/utils';

// Retry with custom options
const result = await ErrorHandler.withRetry(
  async () => {
    // Your operation
  },
  {
    maxAttempts: 5,
    delayMs: 2000,
    shouldRetry: (error) => !(error instanceof BrowserError),
  }
);

// Use fallback
const safeResult = await ErrorHandler.withFallback(
  riskyOperation,
  'fallback value'
);
```

## 📊 Dashboard

### Features

- **📈 Performance Charts**: Line and bar charts for timing metrics
- **🌐 Network Analysis**: Request waterfall and dependency visualization  
- **🔍 Interactive Filtering**: Filter by metrics, products, network conditions
- **📋 Summary Statistics**: Aggregated performance insights
- **💾 Export Capabilities**: Download data as CSV or JSON

### Components

#### Performance Charts
- **Line Charts**: Show trends across iterations
- **Bar Charts**: Compare metrics across different conditions
- **Summary Cards**: Key performance indicators

#### Network Analysis
- **Waterfall Charts**: Visualize request timing and dependencies
- **Request Statistics**: Detailed timing and size analysis
- **Critical Path Analysis**: Identify performance bottlenecks

### Usage

```typescript
// Custom hooks for optimized data processing
import { useOptimizedReports } from './hooks/useOptimizedReports';
import { usePerformanceChartData } from './hooks/useChartData';

function MyComponent() {
  const { reports, loading, error } = useOptimizedReports();
  const { chartData, filteredData } = usePerformanceChartData(data, filters);
  
  // Component logic
}
```

## 🔧 API Reference

### Core Classes

#### TestExecutor
```typescript
class TestExecutor {
  constructor(product: ProductConfig)
  async run(): Promise<void>
  getResults(): ProductResults
  getNetworkResults(): NetworkResults
  hasFailures(): boolean
}
```

#### PerformanceMonitor
```typescript
class PerformanceMonitor {
  setPage(page: Page): void
  async markStart(markName: string): Promise<void>
  async markEnd(markName: string, startMark: string): Promise<number>
  recordMetric(metricName: InitialLoadMetrics, value: number, unit: string): void
}
```

#### NetworkMonitor
```typescript
class NetworkMonitor {
  setPage(page: Page): void
  async startMonitoring(): Promise<void>
  async stopMonitoring(): Promise<void>
  getNetworkResults(): ContextNetworkResults[]
}
```

### Utility Functions

#### Common Utilities
```typescript
// Statistics
calculateStatistics(values: number[]): Statistics

// Formatting
formatBytes(bytes: number, decimals?: number): string
formatDuration(ms: number): string

// Array operations
groupBy<T, K>(array: T[], keyFn: (item: T) => K): Record<K, T[]>
unique<T>(array: T[], keyFn?: (item: T) => unknown): T[]
chunk<T>(array: T[], size: number): T[][]

// Async utilities
delay(ms: number): Promise<void>
retryWithBackoff<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>
```

#### Validation
```typescript
// Configuration validation
ValidationUtils.validateConfig(config: unknown): Config
ValidationUtils.isDefined<T>(value: T | undefined | null): value is T
ValidationUtils.isNonEmptyString(value: unknown): value is string

// Validators
const validator = new ConfigValidator();
const result = validator.validate(input);
```

#### Error Handling
```typescript
// Error classes
class AppError extends Error
class ConfigurationError extends AppError
class ValidationError extends AppError
class BrowserError extends AppError

// Error utilities
ErrorHandler.withRetry<T>(operation: () => Promise<T>, options?): Promise<T>
ErrorHandler.withFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T>
```


## 🤝 Contributing

### Development Setup

1. **Fork and clone the repository**
2. **Install dependencies** (see Installation section)
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Code Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured for consistent code style
- **Prettier**: Automatic code formatting

### Commit Guidelines

```bash
# Format: type(scope): description
feat(executor): add retry mechanism for failed iterations
fix(dashboard): resolve chart rendering issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Check linting**: `npm run lint`
2. **Format code**: `npm run pretty:fix`
3. **Update documentation** if needed
4. **Create detailed PR description**

### Adding New Features

#### New Performance Metrics
1. Add metric to `InitialLoadMetrics` type
2. Update `METRICS` constants
3. Implement measurement logic in POM
4. Add visualization to dashboard

#### New Page Object Models
1. Create new POM class implementing `POM` interface
2. Add configuration entry
3. Implement required methods
4. Add error handling and logging

## 🔍 Troubleshooting

### Common Issues

#### Browser Launch Failures
```bash
# Install missing dependencies
npx playwright install-deps chromium

# Check browser installation
npx playwright install chromium --force
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### Network Timeouts
- Increase timeout in configuration
- Check network connectivity
- Verify target URLs are accessible

#### Dashboard Not Loading
```bash
# Clear cache and reinstall
cd dashboard
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run debug

# Run with Playwright inspector
export PWDEBUG=1
npm run dev
```

### Performance Issues

1. **Reduce iterations** in configuration
2. **Enable headless mode** for faster execution
3. **Use caching** for repeated operations
4. **Monitor memory usage** during long runs

### Error Analysis

```typescript
// Enable detailed error logging
import { logger } from './src/utils';

logger.updateConfig({
  level: LogLevel.DEBUG,
  enableFile: true,
  filePath: './logs/debug.log',
});
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Playwright Team** for the excellent automation framework
- **Next.js Team** for the powerful React framework
- **Recharts** for beautiful chart components
- **TypeScript Team** for type safety and developer experience

## 📞 Support

For questions, issues, or contributions:

1. **Check existing issues** in the repository
2. **Create detailed bug reports** with reproduction steps
3. **Join discussions** for feature requests
4. **Contribute** improvements and fixes

---

**Built with ❤️ for performance excellence**
