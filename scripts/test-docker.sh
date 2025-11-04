#!/bin/bash

# Test script for Docker setup validation
set -e

echo "🧪 Testing Magic Benchmarking Docker Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check prerequisites
echo "1. Checking prerequisites..."
command -v docker >/dev/null 2>&1
print_status $? "Docker is installed"

command -v docker-compose >/dev/null 2>&1
print_status $? "Docker Compose is installed"

# Test Docker build
echo -e "\n2. Testing Docker build..."
print_info "Building benchmarking image..."
docker build --target benchmarking -t magic-benchmarking-test:latest . >/dev/null 2>&1
print_status $? "Benchmarking image built successfully"

print_info "Building dashboard image..."
docker build --target dashboard -t magic-dashboard-test:latest . >/dev/null 2>&1
print_status $? "Dashboard image built successfully"

# Test basic container functionality
echo -e "\n3. Testing container functionality..."
print_info "Testing Node.js in benchmarking container..."
docker run --rm magic-benchmarking-test:latest node --version >/dev/null 2>&1
print_status $? "Node.js works in benchmarking container"

print_info "Testing Playwright installation..."
docker run --rm magic-benchmarking-test:latest npx playwright --version >/dev/null 2>&1
print_status $? "Playwright is available in container"

# Test configuration loading
echo -e "\n4. Testing configuration loading..."
print_info "Testing default configuration..."
docker run --rm magic-benchmarking-test:latest node -e "
const { CONFIG } = require('./dist/config.js');
console.log('Config loaded:', !!CONFIG);
console.log('Products:', CONFIG.products.length);
" 2>/dev/null | grep -q "Config loaded: true"
print_status $? "Default configuration loads correctly"

print_info "Testing environment configuration..."
docker run --rm -e MAGIC_BENCHMARKING_CONFIG='{"execution":{"iterations":5}}' magic-benchmarking-test:latest node -e "
const { CONFIG } = require('./dist/config.js');
console.log('Iterations:', CONFIG.execution.iterations);
" 2>/dev/null | grep -q "Iterations: 5"
print_status $? "Environment configuration override works"

# Test docker-compose
echo -e "\n5. Testing Docker Compose..."
print_info "Validating docker-compose.yml..."
docker-compose config >/dev/null 2>&1
print_status $? "Docker Compose configuration is valid"

# Test results directory mounting
echo -e "\n6. Testing volume mounting..."
print_info "Testing results directory mounting..."
mkdir -p ./dashboard/public/results
docker run --rm -v $(pwd)/dashboard/public/results:/app/dashboard/public/results magic-benchmarking-test:latest ls -la /app/dashboard/public/results >/dev/null 2>&1
print_status $? "Results directory mounting works"

# Cleanup test images
echo -e "\n7. Cleaning up..."
print_info "Removing test images..."
docker rmi magic-benchmarking-test:latest magic-dashboard-test:latest >/dev/null 2>&1
print_status $? "Test images cleaned up"

echo -e "\n${GREEN}🎉 All Docker tests passed successfully!${NC}"
echo -e "\n📋 Next steps:"
echo "   • Run 'docker-compose --profile benchmarking up' to test benchmarking"
echo "   • Run 'docker-compose --profile dashboard up' to test dashboard"
echo "   • Push to GitHub to trigger automated workflows"
echo "   • Check DEPLOYMENT.md for detailed usage instructions"
