# Magic Benchmarking Framework

A comprehensive performance benchmarking framework for Magic Checkout using Playwright automation with a Next.js dashboard for visualization and analysis.

## 🆕 Recent Updates

### Latest Features & Improvements

- **🔧 Enhanced Environment Configuration**: Comprehensive environment variable support with detailed documentation and examples
- **📊 Advanced Dashboard**: Interactive Next.js dashboard with rich visualizations, filtering, and export capabilities
- **🎯 Page Object Model Architecture**: Extensible POM design pattern for easy addition of new products
- **🌐 Network Analysis**: Detailed network request monitoring and waterfall visualization
- **⚡ Performance Optimizations**: Improved caching, memoization, and data processing
- **🛡️ Robust Error Handling**: Enhanced retry mechanisms and graceful error recovery
- **📈 Statistical Analysis**: Comprehensive metrics with statistical summaries and trend analysis
- **🔍 Debug & Monitoring**: Enhanced logging with structured output and performance tracking

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
- [Page Object Model (POM) Architecture](#page-object-model-pom-architecture)
- [Adding New Products to the Framework](#adding-new-products-to-the-framework)
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

Create a `.env` file in the project root to configure the framework. Here's a complete example:

```bash
# =============================================================================
# GENERAL CONFIGURATION
# =============================================================================

# Environment mode (development/production)
# Affects logging level and other development features
NODE_ENV=development

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Log level (debug, info, warn, error)
# In development: defaults to debug, in production: defaults to info
LOG_LEVEL=info

# Enable file logging (true/false)
# When enabled, logs will be written to the specified file path
ENABLE_FILE_LOGGING=false

# Log file path (only used when ENABLE_FILE_LOGGING=true)
# Directory will be created automatically if it doesn't exist
LOG_FILE_PATH=./logs/app.log

# =============================================================================
# PLAYWRIGHT/BROWSER CONFIGURATION
# =============================================================================

# Run Playwright in headless mode (true/false)
# Set to false for debugging, true for CI/automated runs
PLAYWRIGHT_HEADLESS=true

# Silent test execution (true/false)
# Reduces console output during test execution
SILENT_TESTS=true

# CI environment indicator (automatically set by CI systems)
# Used by Playwright for retry and worker configuration
# CI=true

# =============================================================================
# BENCHMARKING CONFIGURATION
# =============================================================================

# Complete JSON configuration (alternative to individual settings below)
# If provided, this takes precedence over individual environment variables
# MAGIC_BENCHMARKING_CONFIG={"products":[...], "execution_matrix":{...}, ...}

# Number of iterations to run for each test condition
# Higher values provide more statistical accuracy but take longer
BENCHMARK_ITERATIONS=20

# =============================================================================
# NETWORK CONDITIONS
# =============================================================================

# Enable slow 4G network throttling (true/false)
# Simulates 500kbps download/upload with 400ms latency
BENCHMARK_NETWORK_SLOW_4G=true

# Enable no network throttling (true/false)
# Tests with full network speed
BENCHMARK_NETWORK_NO_THROTTLING=true

# =============================================================================
# CPU CONDITIONS
# =============================================================================

# Enable 4x CPU slowdown (true/false)
# Simulates slower devices by throttling CPU
BENCHMARK_CPU_4X_SLOWDOWN=false

# Enable no CPU throttling (true/false)
# Tests with full CPU performance
BENCHMARK_CPU_NO_THROTTLING=true

# =============================================================================
# EXAMPLE CONFIGURATIONS
# =============================================================================

# Quick testing (fewer iterations, basic conditions)
# BENCHMARK_ITERATIONS=5
# BENCHMARK_NETWORK_SLOW_4G=false
# BENCHMARK_NETWORK_NO_THROTTLING=true
# BENCHMARK_CPU_4X_SLOWDOWN=false
# BENCHMARK_CPU_NO_THROTTLING=true

# Comprehensive testing (more iterations, all conditions)
# BENCHMARK_ITERATIONS=50
# BENCHMARK_NETWORK_SLOW_4G=true
# BENCHMARK_NETWORK_NO_THROTTLING=true
# BENCHMARK_CPU_4X_SLOWDOWN=true
# BENCHMARK_CPU_NO_THROTTLING=true

# CI/Production testing (headless, file logging)
# NODE_ENV=production
# PLAYWRIGHT_HEADLESS=true
# SILENT_TESTS=true
# ENABLE_FILE_LOGGING=true
# LOG_FILE_PATH=./logs/benchmark.log
# LOG_LEVEL=info
```

> **💡 Tip**: Copy the `.env.example` file to `.env` and modify the values as needed for your environment.

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

## 🎯 Page Object Model (POM) Architecture

### What is POM?

The **Page Object Model (POM)** is a design pattern that creates an abstraction layer between your test automation code and the web pages being tested. In the Magic Benchmarking Framework, POM classes encapsulate the interactions with specific checkout products, making the framework easily extensible to support new products.

### Key Benefits

- **🔧 Maintainability**: Changes to UI elements only require updates in one place
- **♻️ Reusability**: Common interactions can be shared across different test scenarios
- **📖 Readability**: Tests become more readable and self-documenting
- **🧪 Testability**: Easier to mock and unit test individual components
- **🔀 Scalability**: Easy to add support for new products without modifying core logic

### POM Interface

All POM classes must implement the `POM` interface:

```typescript
export interface POM {
  initialize(): Promise<void>;
  triggerCheckout(skipMetrics: boolean): Promise<void>;
}
```

### Current Implementation: Magic Checkout

The framework includes a complete POM implementation for Magic Checkout (`src/pom/magic-checkout.ts`):

```typescript
class MagicCheckoutPOM implements POM {
  private page: Page;
  private productConfig: ProductConfig;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;

  // Core methods
  public async initialize(): Promise<void> {
    // Navigate to entry URL and wait for page load
  }

  public async triggerCheckout(skipMetrics: boolean = false): Promise<void> {
    // Trigger checkout flow and measure performance metrics
  }
}
```

### Performance Metrics Captured

The POM captures these key performance metrics:

- **`click_to_popup`**: Time from button click to popup appearance
- **`popup_to_content`**: Time from popup to content visibility
- **`click_to_content`**: Total time from click to content ready
- **`total_load_time`**: Complete loading time until main thread idle
- **`content_to_interactive`**: Time from content visible to interactive

## 🚀 Adding New Products to the Framework

### Step 1: Create Product Configuration

Add your product to the configuration in `src/config.ts`:

```typescript
const defaultConfig = {
  products: [
    {
      name: 'MagicCheckout',
      entry_url: 'https://razorpay.com/demopg3/',
      pom_file: 'magic-checkout',
      enabled: true,
    },
    // Add your new product here
    {
      name: 'YourProduct',
      entry_url: 'https://your-product-demo.com/',
      pom_file: 'your-product',
      enabled: true,
    },
  ],
  // ... rest of configuration
};
```

### Step 2: Create POM Implementation

Create a new POM file in `src/pom/your-product.ts`:

```typescript
import { Page } from 'playwright';
import { POM } from '../types/pom';
import { ProductConfig } from '../types/config';
import { expect } from '@playwright/test';
import { PerformanceMonitor } from '../performance';
import { NetworkMonitor } from '../network-monitor';
import { PERFORMANCE_MARKERS } from '../constants/performance';

class YourProductPOM implements POM {
  private page: Page;
  private productConfig: ProductConfig;
  private performanceMonitor: PerformanceMonitor;
  private networkMonitor: NetworkMonitor;

  constructor(
    page: Page,
    productConfig: ProductConfig,
    performanceMonitor: PerformanceMonitor,
    networkMonitor: NetworkMonitor
  ) {
    this.page = page;
    this.productConfig = productConfig;
    this.performanceMonitor = performanceMonitor;
    this.networkMonitor = networkMonitor;
  }

  public async initialize(): Promise<void> {
    try {
      console.log(`Initializing POM for ${this.productConfig.name}`);
      await this.page.goto(this.productConfig.entry_url);
      await this.page.waitForLoadState('domcontentloaded');
      console.log(`POM initialized for ${this.productConfig.name}`);
    } catch (error) {
      console.log(`Failed to initialize POM for ${this.productConfig.name}: ${error}`);
      throw error;
    }
  }

  public async triggerCheckout(skipMetrics: boolean = false): Promise<void> {
    try {
      console.log(`Triggering checkout for ${this.productConfig.name}`);

      // 1. Find and interact with checkout trigger element
      const checkoutButton = this.page.locator('[data-testid="checkout-button"]');
      await expect(checkoutButton).toBeVisible();

      // 2. Mark start time
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CHECKOUT_START);

      // 3. Trigger checkout
      await checkoutButton.click();

      // 4. Wait for checkout interface and mark popup appearance
      const checkoutModal = this.page.locator('[data-testid="checkout-modal"]');
      await expect(checkoutModal).toBeVisible();
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.POPUP_APPEARS);

      // 5. Start network monitoring
      if (!skipMetrics) {
        await this.networkMonitor.startMonitoring();
      }

      // 6. Wait for content to be ready and mark content appearance
      const contentElement = this.page.locator('[data-testid="checkout-content"]');
      await expect(contentElement).toBeVisible();
      await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CONTENT_APPEARS);

      // 7. Wait for main thread idle and mark
      const idleTimestamp = await this.performanceMonitor.waitForMainThreadIdle();
      await this.performanceMonitor.markAtTimestamp(
        PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
        idleTimestamp
      );

      // 8. Stop network monitoring
      if (!skipMetrics) {
        await this.networkMonitor.stopMonitoring();
      }

      // 9. Calculate and record metrics
      if (!skipMetrics) {
        const metrics = [
          {
            name: 'click_to_popup' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.POPUP_APPEARS,
          },
          {
            name: 'popup_to_content' as const,
            start: PERFORMANCE_MARKERS.POPUP_APPEARS,
            end: PERFORMANCE_MARKERS.CONTENT_APPEARS,
          },
          {
            name: 'click_to_content' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.CONTENT_APPEARS,
          },
          {
            name: 'total_load_time' as const,
            start: PERFORMANCE_MARKERS.CHECKOUT_START,
            end: PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
          },
          {
            name: 'content_to_interactive' as const,
            start: PERFORMANCE_MARKERS.CONTENT_APPEARS,
            end: PERFORMANCE_MARKERS.MAIN_THREAD_IDLE,
          },
        ];

        for (const metric of metrics) {
          const duration = await this.performanceMonitor.measureDuration(metric.start, metric.end);
          this.performanceMonitor.recordMetric(metric.name, duration, 'ms');
        }
      }

      console.log(`✅ Checkout triggered successfully for ${this.productConfig.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Failed to trigger checkout for ${this.productConfig.name}: ${errorMessage}`);
      throw error;
    }
  }
}

export default YourProductPOM;
```

### Step 3: Update POM Factory (if needed)

If you have a POM factory pattern, update it to include your new product:

```typescript
// In executor.ts or similar file
const pomModule = await import(`./pom/${product.pom_file}`);
const POMClass = pomModule.default;
const pom = new POMClass(page, product, performanceMonitor, networkMonitor);
```

### Step 4: Test Your Implementation

1. **Enable your product** in the configuration
2. **Run a test** to verify the POM works correctly:
   ```bash
   npm run dev
   ```
3. **Check the results** in the dashboard to ensure metrics are captured

### Best Practices for POM Development

#### 1. **Robust Element Selection**
```typescript
// ✅ Good: Use data attributes or stable selectors
const button = this.page.locator('[data-testid="checkout-button"]');

// ❌ Avoid: Fragile selectors that may break
const button = this.page.locator('.btn.btn-primary.checkout-btn');
```

#### 2. **Proper Error Handling**
```typescript
try {
  await this.page.locator('[data-testid="element"]').click();
} catch (error) {
  console.log(`Failed to click element: ${error}`);
  throw error; // Re-throw to maintain error flow
}
```

#### 3. **Consistent Timing Measurements**
```typescript
// Always follow this pattern for consistent metrics
await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.CHECKOUT_START);
// ... perform action
await this.performanceMonitor.markStart(PERFORMANCE_MARKERS.POPUP_APPEARS);
// ... wait for next milestone
```

#### 4. **Network Monitoring**
```typescript
// Start monitoring after the initial action
if (!skipMetrics) {
  await this.networkMonitor.startMonitoring();
}

// Stop monitoring when interaction is complete
if (!skipMetrics) {
  await this.networkMonitor.stopMonitoring();
}
```

#### 5. **Comprehensive Logging**
```typescript
console.log(`🔍 Starting ${this.productConfig.name} checkout process`);
console.log(`✅ ${this.productConfig.name} checkout completed successfully`);
console.log(`❌ ${this.productConfig.name} checkout failed: ${errorMessage}`);
```

### Troubleshooting New POM Implementations

#### Common Issues

1. **Element not found**: Use `await expect(element).toBeVisible()` before interacting
2. **Timing issues**: Add appropriate waits for network requests or animations
3. **Iframe handling**: Use `contentFrame()` for iframe interactions
4. **Network monitoring**: Ensure monitoring starts after the initial trigger action

#### Debug Mode

Run with debug mode to see detailed execution:
```bash
export LOG_LEVEL=debug
npm run debug
```

#### Playwright Inspector

Use Playwright's built-in inspector for step-by-step debugging:
```bash
export PWDEBUG=1
npm run dev
```

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
