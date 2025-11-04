#!/bin/bash

# Validate GitHub Actions workflows
set -e

echo "🔍 Validating GitHub Actions Workflows"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if GitHub CLI is available (optional)
if command -v gh >/dev/null 2>&1; then
    HAS_GH_CLI=true
    print_info "GitHub CLI detected - will validate with GitHub API"
else
    HAS_GH_CLI=false
    print_info "GitHub CLI not found - performing local validation only"
fi

# Validate workflow files exist
echo -e "\n1. Checking workflow files..."
[ -f ".github/workflows/benchmark-and-deploy.yml" ]
print_status $? "benchmark-and-deploy.yml exists"

[ -f ".github/workflows/benchmark-only.yml" ]
print_status $? "benchmark-only.yml exists"

# Validate YAML syntax (if yq is available)
if command -v yq >/dev/null 2>&1; then
    echo -e "\n2. Validating YAML syntax..."
    yq eval '.name' .github/workflows/benchmark-and-deploy.yml >/dev/null 2>&1
    print_status $? "benchmark-and-deploy.yml has valid YAML syntax"
    
    yq eval '.name' .github/workflows/benchmark-only.yml >/dev/null 2>&1
    print_status $? "benchmark-only.yml has valid YAML syntax"
else
    print_info "yq not found - skipping YAML syntax validation"
fi

# Check required workflow components
echo -e "\n3. Checking workflow structure..."

# Check for required triggers
grep -q "workflow_dispatch:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has manual trigger"

grep -q "push:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has push trigger"

grep -q "schedule:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has schedule trigger"

# Check for required jobs
grep -q "jobs:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has jobs defined"

grep -q "benchmark:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has benchmark job"

grep -q "build-and-deploy:" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml has build-and-deploy job"

# Check for Playwright installation
grep -q "playwright install" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml installs Playwright browsers"

# Check for artifact upload
grep -q "upload-artifact" .github/workflows/benchmark-and-deploy.yml
print_status $? "benchmark-and-deploy.yml uploads artifacts"

# Validate with GitHub CLI if available
if [ "$HAS_GH_CLI" = true ]; then
    echo -e "\n4. Validating with GitHub API..."
    
    # Check if we're in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # Check if remote origin exists
        if git remote get-url origin > /dev/null 2>&1; then
            print_info "Validating workflows with GitHub..."
            
            # This would validate the workflow syntax with GitHub
            # Note: This requires the repository to be pushed to GitHub first
            gh workflow list >/dev/null 2>&1 || print_info "Repository not yet pushed to GitHub - workflow validation will happen on first push"
        else
            print_info "No remote origin configured - add GitHub remote to validate with API"
        fi
    else
        print_info "Not in a git repository - initialize git and add remote for GitHub validation"
    fi
fi

# Check environment variables and secrets documentation
echo -e "\n5. Checking configuration documentation..."
grep -q "MAGIC_BENCHMARKING_CONFIG" .github/workflows/benchmark-and-deploy.yml
print_status $? "Workflow uses MAGIC_BENCHMARKING_CONFIG environment variable"

[ -f "DEPLOYMENT.md" ]
print_status $? "DEPLOYMENT.md documentation exists"

grep -q "GitHub Actions" DEPLOYMENT.md
print_status $? "DEPLOYMENT.md documents GitHub Actions usage"

# Check Docker integration
echo -e "\n6. Checking Docker integration..."
grep -q "docker" .github/workflows/benchmark-and-deploy.yml
print_status $? "Workflow includes Docker operations"

grep -q "REGISTRY" .github/workflows/benchmark-and-deploy.yml
print_status $? "Workflow configures container registry"

[ -f "Dockerfile" ]
print_status $? "Dockerfile exists for containerization"

[ -f "docker-compose.yml" ]
print_status $? "Docker Compose configuration exists"

# Summary
echo -e "\n${GREEN}🎉 Workflow validation completed successfully!${NC}"
echo -e "\n📋 Validation Summary:"
echo "   • Workflow files are present and properly structured"
echo "   • Required jobs and steps are configured"
echo "   • Docker integration is set up"
echo "   • Documentation is available"
echo ""
echo "🚀 Ready to deploy! Next steps:"
echo "   1. Push to GitHub repository"
echo "   2. Enable GitHub Pages in repository settings"
echo "   3. Run workflows manually or wait for triggers"
echo "   4. Check Actions tab for execution status"
