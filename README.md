# Magic Benchmarking Framework

A performance benchmarking framework for Magic Checkout using Playwright automation with a Next.js dashboard for visualization and analysis.

## What is this project?

This project automates performance testing of Magic Checkout by:

- Running automated browser tests using Playwright
- Capturing detailed performance metrics (timing, network requests, user experience indicators)
- Providing an interactive Next.js dashboard for visualization and analysis
- Supporting multiple test conditions (network throttling, CPU throttling, different products)

## Execution Contexts

The framework supports testing under various conditions to simulate real-world scenarios:

### Network Conditions

- **Slow 4G**: 200kbps download, 100kbps upload, 500ms latency (simulates poor mobile connectivity, congested networks)
- **Fast 4G**: 1.5Mbps download, 500kbps upload, 150ms latency (simulates good mobile connectivity)
- **No Throttling**: Full network speed (simulates desktop/WiFi connectivity)

### CPU Conditions

- **No Throttling**: 1x CPU rate (simulates high-end devices - flagship phones, desktops)
- **2x Slowdown**: 4x CPU rate (simulates mid-range devices - 2-3 year old phones, budget laptops)
- **4x Slowdown**: 6x CPU rate (simulates low-end devices - budget phones, older devices)

### Device Simulation

The framework includes realistic mobile device simulation:

- **Mobile viewport**: 390x844 (iPhone standard)
- **Touch interface**: Touch events enabled
- **Extended timeouts**: 60-second timeout for all conditions
- **Headless execution**: Optimized for CI/CD environments

### Expected Performance

With these realistic settings, you should expect:

- **Slow 4G + Mid-range CPU**: TTI around 6-8 seconds (realistic for poor conditions)
- **Fast 4G + High-end CPU**: TTI around 2-3 seconds (good mobile experience)
- **No Throttling**: TTI under 2 seconds (desktop/WiFi experience)

### Products

- **Magic Checkout**: Razorpay's checkout solution
- **Gokwik**: Alternative checkout solution for comparison

## Usage

### Running Benchmarks via GitHub Actions (Parallel Execution)

1. Go to [Performance Benchmarking](https://github.com/vc-arjun/magic-benchmarking/actions/workflows/benchmark-and-deploy.yml) workflow

2. Click **"Run workflow"** and configure the inputs:
   - **iterations**: Iterations per combination (e.g., 20 iterations per network/CPU combo)
   - **max_iterations_per_job**: Maximum iterations per parallel job (e.g., 20)
   - **network_conditions**: Comma-separated network conditions (default: "no_throttling,slow_4g,fast_4g")
     - Available options: `slow_4g`, `fast_4g`, `no_throttling`
   - **cpu_conditions**: Comma-separated CPU conditions (default: "no_throttling,2x_slowdown,4x_slowdown")
     - Available options: `no_throttling`, `2x_slowdown`, `4x_slowdown`
   - **products**: Comma-separated products to test (default: "MagicCheckout,Gokwik")
     - Available options: `MagicCheckout`, `Gokwik`
   - **override_reports**: Override existing reports instead of concatenating (default: false)
   - **skip_benchmarking**: Skip benchmarking and use existing results (default: false)

3. The **parallel workflow** will:
   - **Calculate total iterations**: 20 iterations × network conditions × CPU conditions × products
     - Example: 20 iterations × 3 networks (no_throttling,slow_4g,fast_4g) × 3 CPU (no_throttling,2x_slowdown,4x_slowdown) × 2 products = 360 total iterations
   - **Split across parallel jobs**: 360 total iterations ÷ 20 max per job = 18 parallel jobs
   - **Execute jobs concurrently** to reduce total execution time
   - **Consolidate results** from all jobs into a single comprehensive report
   - **Deploy the dashboard** only if all jobs succeed

4. **Preview Results**:
   - Once the CI build succeeds, go to [https://vc-arjun.github.io/magic-benchmarking](https://vc-arjun.github.io/magic-benchmarking).
   - From the list of reports, click on the report you want to preview, a detailed dashboard will be opened.
   - You can also download the report using the Download button on the top-right corner, in JSON and CSV formats.
   - Use the Visualization controls to alter the graphs and values for different views.

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

### Environment Variables

For local development, you can customize benchmark execution using environment variables:

```bash
# Number of iterations per combination per product
export BENCHMARK_ITERATIONS=20

# Network conditions to test (comma-separated)
# Available: slow_4g, fast_4g, no_throttling
export BENCHMARK_NETWORK_CONDITIONS="no_throttling,slow_4g,fast_4g"

# CPU conditions to test (comma-separated)  
# Available: no_throttling, 2x_slowdown, 4x_slowdown
export BENCHMARK_CPU_CONDITIONS="no_throttling,2x_slowdown,4x_slowdown"

# Products to test (comma-separated)
# Available: MagicCheckout, Gokwik
export BENCHMARK_PRODUCTS="MagicCheckout,Gokwik"

# Playwright configuration
export PLAYWRIGHT_HEADLESS=true
export SILENT_TESTS=true
export LOG_LEVEL=info
```

### Basic Commands

```bash
# Run benchmarks locally
npm start

# Run with custom configuration
BENCHMARK_ITERATIONS=5 BENCHMARK_NETWORK_CONDITIONS="no_throttling" npm start

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
