# Windows Launcher (launcher.bat)
@echo off
title AI Mastery: The Doctor - Startup
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║             🖖 AI MASTERY: THE DOCTOR 🖖                     ║
echo ║                                                              ║
echo ║   Emergency Medical Hologram Educational System              ║
echo ║   Initializing Stable Diffusion Training Protocol...        ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Minimum required version: 16.0.0
    echo.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this from the ai-mastery-doctor directory.
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies for the first time...
    echo This may take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo Please check your internet connection and try again.
        echo You can also try: npm cache clean --force
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully!
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️ Creating environment configuration...
    copy ".env.example" ".env" >nul
    echo.
    echo 🔑 IMPORTANT: Please edit .env file and add your API keys:
    echo    - OPENAI_API_KEY (recommended for best experience)
    echo    - GEMINI_API_KEY (alternative)
    echo.
    echo The Doctor can run in simulation mode without API keys,
    echo but you'll get the full experience with proper API access.
    echo.
    echo Press any key to continue with current configuration...
    pause >nul
    echo.
)

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

REM Clear any stuck processes (more thorough)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🚀 Starting The Doctor's Educational Systems...
echo.
echo If this is your first time:
echo 1. The Doctor will initialize his personality matrix
echo 2. Educational databases will be prepared
echo 3. The holographic interface will activate
echo.
echo "Please state the nature of your educational emergency."
echo.

REM Start the application
call npm start

if %errorlevel% neq 0 (
    echo.
    echo ❌ The Doctor's systems encountered an error during startup.
    echo.
    echo Troubleshooting steps:
    echo 1. Check that all dependencies are installed: npm install
    echo 2. Verify your .env configuration
    echo 3. Ensure no other instances are running
    echo 4. Try: npm run doctor (system health check)
    echo.
    pause
    exit /b 1
)

echo.
echo 🖖 The Doctor's training session has concluded.
echo Live long and prosper!
pause

# =============================================================================

# Unix/Linux/Mac Launcher (launcher.sh)
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║             🖖 AI MASTERY: THE DOCTOR 🖖                     ║"
    echo "║                                                              ║"
    echo "║   Emergency Medical Hologram Educational System              ║"
    echo "║   Initializing Stable Diffusion Training Protocol...        ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Make script executable
chmod +x "$0"

print_header

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or using your package manager:"
    echo "  macOS: brew install node"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  CentOS/RHEL: sudo yum install nodejs npm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"
if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
    print_warning "Node.js version $NODE_VERSION detected. Recommended: v16.0.0 or higher"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this from the ai-mastery-doctor directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for the first time..."
    print_info "This may take a few minutes..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed successfully!"
    echo
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_info "Creating environment configuration..."
    cp ".env.example" ".env"
    echo
    print_warning "IMPORTANT: Please edit .env file and add your API keys:"
    echo "   - OPENAI_API_KEY (recommended for best experience)"
    echo "   - GEMINI_API_KEY (alternative)"
    echo
    echo "The Doctor can run in simulation mode without API keys,"
    echo "but you'll get the full experience with proper API access."
    echo
    read -p "Press Enter to continue with current configuration..."
fi

# Create data directory if it doesn't exist
mkdir -p data

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "electron" 2>/dev/null

print_info "Starting The Doctor's Educational Systems..."
echo
echo "If this is your first time:"
echo "1. The Doctor will initialize his personality matrix"
echo "2. Educational databases will be prepared" 
echo "3. The holographic interface will activate"
echo
echo '"Please state the nature of your educational emergency."'
echo

# Start the application
npm start

if [ $? -ne 0 ]; then
    echo
    print_error "The Doctor's systems encountered an error during startup."
    echo
    echo "Troubleshooting steps:"
    echo "1. Check that all dependencies are installed: npm install"
    echo "2. Verify your .env configuration"
    echo "3. Ensure no other instances are running"
    echo "4. Check the logs above for specific error messages"
    echo
    exit 1
fi

echo
print_success "The Doctor's training session has concluded."
echo "🖖 Live long and prosper!"

# =============================================================================

# Development Launcher (dev-launcher.sh)
#!/bin/bash

# Development version with hot reload and debugging
print_header() {
    echo -e "\033[0;36m"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║          🔧 AI MASTERY: THE DOCTOR (DEV MODE) 🔧            ║"
    echo "║                                                              ║"
    echo "║   Development Environment with Hot Reload                    ║"
    echo "║   Debug Mode: ENABLED                                        ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "\033[0m"
}

print_header

# Set development environment
export NODE_ENV=development
export DEBUG_MODE=true
export DETAILED_ERRORS=true

echo "🔧 Development mode activated"
echo "Features enabled:"
echo "  - Hot reload"
echo "  - Detailed error messages"
echo "  - Debug logging"
echo "  - Development tools"
echo

# Install dev dependencies
npm install --include=dev

# Start with concurrently for development
npm run dev

# =============================================================================

# Quick Setup Script (setup.sh)
#!/bin/bash

echo "🚀 AI Mastery: The Doctor - Quick Setup"
echo "======================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f ".env" ]; then
    cp ".env.example" ".env"
    echo "✅ Environment file created"
fi

# Create directories
mkdir -p data
mkdir -p logs
mkdir -p assets

echo "✅ Setup complete!"
echo
echo "Next steps:"
echo "1. Edit .env file with your API keys (optional)"
echo "2. Run ./launcher.sh to start The Doctor"
echo
echo "For development: ./dev-launcher.sh"

# =============================================================================

# Windows Development Launcher (dev-launcher.bat)
@echo off
title AI Mastery: The Doctor - Development Mode
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║          🔧 AI MASTERY: THE DOCTOR (DEV MODE) 🔧            ║
echo ║                                                              ║
echo ║   Development Environment with Hot Reload                    ║
echo ║   Debug Mode: ENABLED                                        ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Set development environment
set NODE_ENV=development
set DEBUG_MODE=true
set DETAILED_ERRORS=true

echo 🔧 Development mode activated
echo Features enabled:
echo   - Hot reload
echo   - Detailed error messages
echo   - Debug logging
echo   - Development tools
echo.

REM Install dev dependencies
npm install --include=dev

REM Start with development configuration
npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ❌ Development server failed to start
    pause
    exit /b 1
)

# =============================================================================

# Installation Check Script (check-install.js)
// Run with: node check-install.js

const fs = require('fs');
const path = require('path');

console.log('🔍 AI Mastery: The Doctor - Installation Check');
console.log('==============================================\n');

const checks = [
    {
        name: 'package.json exists',
        check: () => fs.existsSync('package.json'),
        fix: 'Run this from the correct directory'
    },
    {
        name: 'node_modules installed',
        check: () => fs.existsSync('node_modules'),
        fix: 'Run: npm install'
    },
    {
        name: '.env file exists',
        check: () => fs.existsSync('.env'),
        fix: 'Copy .env.example to .env'
    },
    {
        name: 'data directory exists',
        check: () => fs.existsSync('data'),
        fix: 'Create data directory: mkdir data'
    },
    {
        name: 'server directory structure',
        check: () => fs.existsSync('server/server.js'),
        fix: 'Check server files are present'
    },
    {
        name: 'frontend files exist',
        check: () => fs.existsSync('frontend/index.html'),
        fix: 'Check frontend files are present'
    }
];

let allPassed = true;

checks.forEach(check => {
    const passed = check.check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    
    if (!passed) {
        console.log(`   Fix: ${check.fix}`);
        allPassed = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
    console.log('✅ All checks passed! Ready to launch The Doctor.');
    console.log('\nRun: npm start (or use launcher scripts)');
} else {
    console.log('❌ Some checks failed. Please fix the issues above.');
}

console.log('\nFor help, check the README.md file.');

// =============================================================================

# Package Scripts Addition (add to package.json)
/*
Add these scripts to your package.json:

"scripts": {
  "start": "electron .",
  "dev": "concurrently \"npm run start\" \"npm run server\"",
  "server": "node server/server.js",
  "build": "electron-builder",
  "dist": "electron-builder --publish=never",
  "postinstall": "electron-builder install-app-deps",
  "setup": "node check-install.js",
  "check": "node check-install.js",
  "clean": "rimraf node_modules dist",
  "reset": "npm run clean && npm install"
}
*/