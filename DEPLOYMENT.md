# Magic Benchmarking - Deployment Guide

This guide covers Docker containerization and GitHub Actions automation for the Magic Benchmarking Framework.

## 🐳 Docker Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Docker Architecture

The project uses a multi-stage Dockerfile with three targets:

1. **`base`**: Builds both the benchmarking framework and dashboard
2. **`benchmarking`**: Runtime image for running Playwright tests
3. **`dashboard`**: Production image for serving the Next.js dashboard

### Local Development with Docker

#### Option 1: Run Benchmarking Only
```bash
# Run benchmarking and save results locally
docker-compose --profile benchmarking up benchmarking

# With custom configuration
MAGIC_BENCHMARKING_CONFIG='{"execution":{"iterations":5}}' \
docker-compose --profile benchmarking up benchmarking
```

#### Option 2: Run Dashboard Only
```bash
# Start the dashboard (requires existing results)
docker-compose --profile dashboard up dashboard

# Access at http://localhost:3000
```

#### Option 3: Full Workflow (Benchmarking + Dashboard)
```bash
# Run benchmarking then start dashboard
docker-compose up magic-benchmarking dashboard-combined

# Access dashboard at http://localhost:3000
```

### Production Docker Commands

#### Build Images
```bash
# Build benchmarking image
docker build --target benchmarking -t magic-benchmarking:latest .

# Build dashboard image
docker build --target dashboard -t magic-dashboard:latest .
```

#### Run with Custom Configuration
```bash
# Create custom config
cat > config.json << 'EOF'
{
  "execution": {
    "iterations": 50,
    "timeout": 180000
  },
  "execution_matrix": {
    "network": {
      "slow_3g": {
        "download_throughput": 400000,
        "upload_throughput": 400000,
        "latency": 500,
        "enabled": true
      }
    }
  }
}
EOF

# Run with custom config
docker run -e MAGIC_BENCHMARKING_CONFIG="$(cat config.json | jq -c .)" \
  -v $(pwd)/results:/app/dashboard/public/results \
  magic-benchmarking:latest
```

## 🚀 GitHub Actions Workflows

### Available Workflows

#### 1. Full Benchmark & Deploy (`benchmark-and-deploy.yml`)
**Triggers:**
- Manual dispatch with options
- Push to main branch
- Daily at 2 AM UTC

**Features:**
- Runs benchmarking with configurable parameters
- Builds and deploys dashboard
- Supports staging (GitHub Pages) and production deployment
- Docker image publishing to GitHub Container Registry

**Manual Trigger Options:**
- `config_override`: Custom JSON configuration
- `deployment_environment`: staging/production
- `benchmark_iterations`: Number of iterations

#### 2. Benchmark Only (`benchmark-only.yml`)
**Triggers:**
- Manual dispatch only

**Features:**
- Runs benchmarking without deployment
- Configurable network conditions
- Uploads results as artifacts
- Faster execution for testing

**Manual Trigger Options:**
- `config_override`: Custom JSON configuration
- `iterations`: Number of iterations
- `network_conditions`: all/slow_4g_only/no_throttling_only

### Setting Up GitHub Actions

#### 1. Enable GitHub Pages
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy to Pages

#### 2. Required Secrets (Optional)
For production deployment, add these secrets in repository Settings → Secrets:
- `VERCEL_TOKEN`: For Vercel deployment
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: For AWS deployment
- Custom deployment secrets as needed

#### 3. Permissions
The workflows require these permissions (automatically configured):
- `contents: read`: Read repository content
- `packages: write`: Push Docker images
- `pages: write`: Deploy to GitHub Pages
- `id-token: write`: OIDC authentication

### Usage Examples

#### Run Full Benchmark & Deploy
```bash
# Via GitHub CLI
gh workflow run benchmark-and-deploy.yml \
  -f deployment_environment=staging \
  -f benchmark_iterations=30

# Via GitHub UI
# Go to Actions → Magic Benchmarking & Dashboard Deployment → Run workflow
```

#### Run Quick Benchmark Test
```bash
# Via GitHub CLI
gh workflow run benchmark-only.yml \
  -f iterations=5 \
  -f network_conditions=no_throttling_only

# Custom configuration
gh workflow run benchmark-only.yml \
  -f config_override='{"execution":{"iterations":3,"browsers":["chromium"]}}'
```

#### Scheduled Runs
The main workflow runs daily at 2 AM UTC. To modify:
```yaml
schedule:
  - cron: '0 14 * * *'  # 2 PM UTC daily
  - cron: '0 2 * * 1'   # 2 AM UTC every Monday
```

## 📊 Accessing Results

### Local Results
```bash
# Results are saved to
./dashboard/public/results/

# View in dashboard
cd dashboard && npm run dev
# Open http://localhost:3000
```

### GitHub Actions Results
1. **Artifacts**: Download from Actions run page
2. **GitHub Pages**: Automatic deployment to `https://username.github.io/repository-name`
3. **Container Registry**: Images at `ghcr.io/username/repository-name`

## 🔧 Configuration

### Environment Variables

#### Benchmarking Configuration
```bash
# Complete configuration override
export MAGIC_BENCHMARKING_CONFIG='{
  "products": [...],
  "execution_matrix": {...},
  "execution": {...},
  "output": {...}
}'

# The framework will use default config if not set
```

#### Dashboard Configuration
```bash
# For GitHub Pages deployment
export GITHUB_PAGES=true
export GITHUB_REPOSITORY=username/repo-name

# For custom deployment
export NODE_ENV=production
```

### Docker Environment Variables
```bash
# In docker-compose.yml or docker run
NODE_ENV=production
MAGIC_BENCHMARKING_CONFIG={"execution":{"iterations":10}}
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

## 🛠️ Troubleshooting

### Common Issues

#### Docker Build Fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache --target benchmarking .
```

#### Playwright Browser Issues
```bash
# Install browsers in container
docker run -it magic-benchmarking:latest npx playwright install chromium
```

#### GitHub Actions Permissions
```bash
# Check workflow permissions in repository settings
# Settings → Actions → General → Workflow permissions
# Select "Read and write permissions"
```

#### Results Not Appearing
```bash
# Check results directory
ls -la dashboard/public/results/

# Verify file permissions
chmod -R 755 dashboard/public/results/
```

### Performance Optimization

#### Faster Docker Builds
```bash
# Use .dockerignore to exclude unnecessary files
# Build only what you need
docker build --target benchmarking .  # Skip dashboard build
```

#### Reduce GitHub Actions Runtime
```bash
# Use benchmark-only.yml for testing
# Reduce iterations for quick tests
# Use specific network conditions
```

## 📈 Monitoring & Alerts

### GitHub Actions Notifications
- Failed workflows send email notifications
- Set up Slack/Discord webhooks for team notifications
- Use GitHub status checks for PR protection

### Result Monitoring
- Results are timestamped and versioned
- Artifacts are retained for 30 days (configurable)
- Dashboard shows historical trends

## 🔄 CI/CD Integration

### Branch Protection
```yaml
# .github/branch-protection.yml
required_status_checks:
  - benchmark
  - build-and-deploy
```

### Pull Request Automation
```yaml
# Add to workflow for PR validation
on:
  pull_request:
    paths:
      - 'src/**'
      - 'dashboard/**'
```

This setup provides a complete CI/CD pipeline for automated performance benchmarking and dashboard deployment.
