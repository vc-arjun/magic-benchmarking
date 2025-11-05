# Magic Benchmarking Framework

A performance benchmarking framework for Magic Checkout using Playwright automation with a Next.js dashboard for visualization and analysis.

## What is this project?

This project automates performance testing of Magic Checkout by:
- Running automated browser tests using Playwright
- Capturing detailed performance metrics (timing, network requests, user experience indicators)
- Providing an interactive Next.js dashboard for visualization and analysis
- Supporting multiple test conditions (network throttling, CPU throttling, different user states)

## Usage

### Running Benchmarks via GitHub Actions (Parallel Execution)

1. Go to the **Actions** tab in your GitHub repository

2. Select **"Performance Benchmarking"** workflow

3. Click **"Run workflow"** and configure the inputs:
   - **iterations**: Iterations per combination (e.g., 20 iterations per network/CPU combo)
   - **max_iterations_per_job**: Maximum iterations per parallel job (e.g., 15)
   - **network_slow_4g**: Enable Slow 4G network throttling (default: false)
   - **network_no_throttling**: Enable no network throttling (default: true)
   - **cpu_4x_slowdown**: Enable 4x CPU slowdown (default: false)
   - **cpu_no_throttling**: Enable no CPU throttling (default: true)

4. The **parallel workflow** will:
   - **Calculate total iterations**: 20 iterations × 2 network conditions = 40 total iterations
   - **Split across parallel jobs**: 40 total iterations ÷ 15 max per job = 3 parallel jobs
   - **Execute jobs concurrently** to reduce total execution time
   - **Consolidate results** from all jobs into a single comprehensive report
   - **Deploy the dashboard** only if all jobs succeed

### Example Execution Plan
```
Input: 20 iterations per combination, max 15 per job
Network conditions: slow_4g=true, no_throttling=true (2 conditions)
CPU conditions: no_throttling=true (1 condition)
Total combinations: 2 × 1 = 2
Total iterations: 20 × 2 = 40
Parallel jobs: 40 ÷ 15 = 3 jobs (15, 15, 10 iterations each)
```

### Benefits of Parallel Execution
- ⚡ **Faster execution**: 40 iterations in ~20 minutes instead of 60+ minutes
- 🛡️ **CI-friendly**: Each job stays within timeout limits (25 minutes max)
- 🔒 **Reliable**: Deployment only happens if ALL jobs succeed
- 📊 **Accurate**: Results are properly consolidated with correct statistics

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
