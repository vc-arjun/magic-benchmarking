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

- **Slow 4G**: 150kbps download, 75kbps upload, 600ms latency (simulates poor mobile connectivity, congested networks)
- **Fast 4G**: 1.6Mbps download, 750kbps upload, 150ms latency (simulates good mobile connectivity)
- **No Throttling**: Full network speed (simulates desktop/WiFi connectivity)

### CPU Conditions

- **No Throttling**: Full CPU performance (simulates high-end devices - flagship phones, desktops)
- **2x Slowdown**: 2x CPU throttling (simulates mid-range devices - 2-3 year old phones, budget laptops)
- **4x Slowdown**: 4x CPU throttling (simulates low-end devices - budget phones, older devices)

### Device Simulation

The framework now includes realistic mobile device simulation:

- **Mobile viewport**: 375x667 (iPhone standard)
- **Mobile user agents**: Realistic Android and iOS user agents
- **Touch interface**: Touch events enabled
- **High-DPI display**: 2x device scale factor
- **Extended timeouts**: 3-minute timeout for slow network conditions

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
   - **max_iterations_per_job**: Maximum iterations per parallel job (e.g., 15)

   **Network Conditions:**
   - **network_slow_4g**: Enable Slow 4G network throttling (150kbps download, 600ms latency) (default: false)
   - **network_fast_4g**: Enable Fast 4G network throttling (1.6Mbps download, 150ms latency) (default: false)
   - **network_no_throttling**: Enable no network throttling (default: true)

   **CPU Conditions:**
   - **cpu_no_throttling**: Enable no CPU throttling (high-end devices) (default: true)
   - **cpu_2x_slowdown**: Enable 2x CPU slowdown (mid-range devices) (default: true)
   - **cpu_4x_slowdown**: Enable 4x CPU slowdown (low-end devices) (default: false)

   **Products:**
   - **product_magic_checkout**: Enable Magic Checkout testing (default: true)
   - **product_gokwik**: Enable Gokwik testing (default: true)

3. The **parallel workflow** will:
   - **Calculate total iterations**: 20 iterations × network conditions × CPU conditions × products
     - Example: 20 iterations × 1 network (no_throttling) × 2 CPU (no_throttling + 2x_slowdown) × 2 products = 80 total iterations
   - **Split across parallel jobs**: 80 total iterations ÷ 15 max per job = 6 parallel jobs
   - **Execute jobs concurrently** to reduce total execution time
   - **Consolidate results** from all jobs into a single comprehensive report
   - **Deploy the dashboard** only if all jobs succeed

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
