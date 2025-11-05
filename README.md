# Magic Benchmarking Framework

A performance benchmarking framework for Magic Checkout using Playwright automation with a Next.js dashboard for visualization and analysis.

## What is this project?

This project automates performance testing of Magic Checkout by:
- Running automated browser tests using Playwright
- Capturing detailed performance metrics (timing, network requests, user experience indicators)
- Providing an interactive Next.js dashboard for visualization and analysis
- Supporting multiple test conditions (network throttling, CPU throttling, different user states)

## Usage

### Running Benchmarks via GitHub Actions

1. Go to [Benchmark and Deploy](https://github.com/vc-arjun/magic-benchmarking/actions/workflows/benchmark-and-deploy.yml) GitHub Action

2. Click "Run workflow" and configure the inputs:
   - **iterations**: Number of test iterations (default: 20)
   - **network_slow_4g**: Enable Slow 4G network throttling (default: false)
   - **network_no_throttling**: Enable no network throttling (default: true)
   - **cpu_4x_slowdown**: Enable 4x CPU slowdown (default: false)
   - **cpu_no_throttling**: Enable no CPU throttling (default: true)
   - **override_reports**: Override existing reports instead of concatenating (default: false)
   - **skip_benchmarking**: Skip benchmarking and rebuild dashboard only (default: false)

3. The workflow will:
   - Execute the benchmarking script with your chosen settings
   - Deploy the results to the dashboard
   - Make the dashboard available at [vc-arjun.github.io/magic-benchmarking/](https://vc-arjun.github.io/magic-benchmarking/)

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd magic-benchmarking
   npm install
   
   # Install dashboard dependencies
   cd dashboard
   npm install
   cd ..
   ```

2. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

### Basic Commands

```bash
# Run benchmarks locally
npm start

# Development mode with live reload
npm run dev

# Debug mode with inspector
npm run debug

# Start dashboard locally
npm run web:dev

# Lint code
npm run lint:fix

# Format code
npm run pretty:fix
```
