#!/bin/bash

# Quick start script for Magic Benchmarking Framework
set -e

echo "🚀 Magic Benchmarking Framework - Quick Start"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}$1${NC}"
    echo "$(printf '=%.0s' $(seq 1 ${#1}))"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to prompt user for choice
prompt_choice() {
    local prompt="$1"
    local default="$2"
    local response
    
    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

print_header "Welcome to Magic Benchmarking Setup!"
echo "This script will help you get started with the benchmarking framework."
echo ""

# Check what the user wants to do
echo "What would you like to do?"
echo "1. Run local benchmarking (Node.js)"
echo "2. Run with Docker"
echo "3. Set up for GitHub Actions"
echo "4. Run dashboard only"
echo "5. Full setup (all of the above)"
echo ""

choice=$(prompt_choice "Enter your choice (1-5)" "1")

case $choice in
    1)
        print_header "Setting up Local Benchmarking"
        
        # Check Node.js
        if command -v node >/dev/null 2>&1; then
            print_success "Node.js is installed ($(node --version))"
        else
            print_error "Node.js is not installed. Please install Node.js 18+ first."
            exit 1
        fi
        
        # Install dependencies
        print_info "Installing dependencies..."
        npm ci
        cd dashboard && npm ci && cd ..
        
        # Install Playwright browsers
        print_info "Installing Playwright browsers..."
        npx playwright install chromium
        
        # Build the project
        print_info "Building the project..."
        npm run build
        
        # Ask for custom config
        use_custom_config=$(prompt_choice "Use custom configuration? (y/n)" "n")
        
        if [ "$use_custom_config" = "y" ]; then
            iterations=$(prompt_choice "Number of iterations" "10")
            export MAGIC_BENCHMARKING_CONFIG="{\"execution\":{\"iterations\":$iterations}}"
            print_info "Using custom config with $iterations iterations"
        fi
        
        print_success "Setup complete! Running benchmarking..."
        npm start
        
        print_info "Starting dashboard..."
        cd dashboard && npm run dev &
        DASHBOARD_PID=$!
        
        echo ""
        print_success "Dashboard is starting at http://localhost:3000"
        print_info "Press Ctrl+C to stop the dashboard"
        wait $DASHBOARD_PID
        ;;
        
    2)
        print_header "Setting up Docker Environment"
        
        # Check Docker
        if command -v docker >/dev/null 2>&1; then
            print_success "Docker is installed"
        else
            print_error "Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        if command -v docker-compose >/dev/null 2>&1; then
            print_success "Docker Compose is installed"
        else
            print_error "Docker Compose is not installed. Please install Docker Compose first."
            exit 1
        fi
        
        # Run validation
        print_info "Running Docker validation..."
        ./scripts/test-docker.sh
        
        # Ask what to run
        echo ""
        echo "What would you like to run with Docker?"
        echo "1. Benchmarking only"
        echo "2. Dashboard only"
        echo "3. Full workflow (benchmarking + dashboard)"
        
        docker_choice=$(prompt_choice "Enter choice (1-3)" "3")
        
        case $docker_choice in
            1)
                print_info "Running benchmarking with Docker..."
                docker-compose --profile benchmarking up benchmarking
                ;;
            2)
                print_info "Running dashboard with Docker..."
                docker-compose --profile dashboard up dashboard
                ;;
            3)
                print_info "Running full workflow with Docker..."
                docker-compose up magic-benchmarking dashboard-combined
                ;;
        esac
        ;;
        
    3)
        print_header "Setting up GitHub Actions"
        
        # Check if we're in a git repo
        if git rev-parse --git-dir > /dev/null 2>&1; then
            print_success "Git repository detected"
        else
            print_error "Not in a git repository. Please run 'git init' first."
            exit 1
        fi
        
        # Validate workflows
        print_info "Validating GitHub Actions workflows..."
        ./scripts/validate-workflows.sh
        
        # Check GitHub CLI
        if command -v gh >/dev/null 2>&1; then
            print_success "GitHub CLI is available"
            
            # Check if logged in
            if gh auth status >/dev/null 2>&1; then
                print_success "Logged into GitHub CLI"
                
                # Offer to create repository
                create_repo=$(prompt_choice "Create GitHub repository? (y/n)" "n")
                if [ "$create_repo" = "y" ]; then
                    repo_name=$(prompt_choice "Repository name" "magic-benchmarking")
                    gh repo create "$repo_name" --public --source=. --push
                    print_success "Repository created and pushed to GitHub"
                fi
            else
                print_info "Please run 'gh auth login' to authenticate with GitHub"
            fi
        else
            print_info "GitHub CLI not found. You can manually push to GitHub."
        fi
        
        echo ""
        print_success "GitHub Actions setup complete!"
        print_info "Next steps:"
        echo "  1. Push your code to GitHub (if not done already)"
        echo "  2. Go to repository Settings → Pages → Source: GitHub Actions"
        echo "  3. Go to Actions tab and run 'Magic Benchmarking & Dashboard Deployment'"
        echo "  4. Check DEPLOYMENT.md for detailed instructions"
        ;;
        
    4)
        print_header "Running Dashboard Only"
        
        # Check if results exist
        if [ -d "dashboard/public/results" ] && [ "$(ls -A dashboard/public/results)" ]; then
            print_success "Benchmark results found"
        else
            print_info "No benchmark results found. Creating sample data..."
            mkdir -p dashboard/public/results
            # You could add sample data creation here
        fi
        
        # Install dashboard dependencies
        print_info "Installing dashboard dependencies..."
        cd dashboard && npm ci
        
        # Start dashboard
        print_info "Starting dashboard..."
        npm run dev
        ;;
        
    5)
        print_header "Full Setup - All Components"
        
        # Run all setups
        print_info "This will set up everything: local environment, Docker, and GitHub Actions"
        
        # Local setup
        print_info "Setting up local environment..."
        npm ci
        cd dashboard && npm ci && cd ..
        npx playwright install chromium
        npm run build
        
        # Docker validation
        if command -v docker >/dev/null 2>&1; then
            print_info "Validating Docker setup..."
            ./scripts/test-docker.sh
        else
            print_info "Docker not found - skipping Docker validation"
        fi
        
        # GitHub Actions validation
        if git rev-parse --git-dir > /dev/null 2>&1; then
            print_info "Validating GitHub Actions..."
            ./scripts/validate-workflows.sh
        else
            print_info "Not in git repository - skipping GitHub Actions validation"
        fi
        
        print_success "Full setup complete!"
        print_info "You can now:"
        echo "  • Run 'npm start' for local benchmarking"
        echo "  • Run 'docker-compose up' for Docker workflow"
        echo "  • Push to GitHub for automated workflows"
        echo "  • Check DEPLOYMENT.md for detailed usage"
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_success "Setup completed successfully! 🎉"
print_info "Check DEPLOYMENT.md for detailed documentation and usage examples."
