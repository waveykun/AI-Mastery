@echo off
REM AI Mastery: The Doctor - Windows Launcher
REM Version 1.0.0

echo.
echo ============================================
echo   AI Mastery: The Doctor - Starting...
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then restart this launcher.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found
    echo Make sure you're running this from the AI Mastery directory
    echo.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies for the first time...
    echo This may take a few minutes...
    echo.
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo ⚙️ Creating configuration file...
    copy ".env.example" ".env" >nul 2>&1
    if exist ".env" (
        echo ✅ Configuration file created: .env
        echo 📝 You can edit .env to add your API keys
    ) else (
        echo ⚠️ Warning: Could not create .env file
        echo The Doctor will run in simulation mode
    )
    echo.
)

echo 🚀 Starting The Doctor...
echo.
echo The Doctor will be available at: http://localhost:3001
echo.
echo To stop the server, press Ctrl+C
echo.

REM Start the application
npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ The Doctor encountered an error during startup
    echo Check the error messages above for details
    echo.
)

echo.
echo 🖖 The Doctor has gone offline. Session ended.
pause

REM =============================================================================
REM Development Launcher (save as dev-launcher.bat)
REM =============================================================================

@echo off
echo.
echo ============================================
echo   AI Mastery: The Doctor - DEV MODE
echo ============================================
echo.

REM Set development environment
set NODE_ENV=development

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Node.js not found
    pause
    exit /b 1
)

REM Install dev dependencies
if not exist "node_modules" (
    echo 📦 Installing development dependencies...
    npm install
)

echo 🛠️ Starting in development mode...
echo.
echo Features enabled:
echo - Hot reload
echo - Debug logging  
echo - Development tools
echo.

npm run dev

pause

REM =============================================================================
REM Quick Setup Script (save as setup.bat)
REM =============================================================================

@echo off
echo.
echo ============================================
echo   AI Mastery: The Doctor - SETUP
echo ============================================
echo.

echo This will set up The Doctor on your computer.
echo.
echo Requirements check:
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js: NOT FOUND
    echo.
    echo Please install Node.js 16+ from: https://nodejs.org/
    echo Then run this setup again.
    pause
    exit /b 1
) else (
    echo ✅ Node.js: Found
    node --version
)

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ npm: NOT FOUND
    pause
    exit /b 1
) else (
    echo ✅ npm: Found
    npm --version
)

echo.
echo Installing The Doctor...
echo.

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Installation failed
    pause
    exit /b 1
)

REM Create config
if not exist ".env" (
    echo ⚙️ Creating configuration...
    (
        echo # AI Mastery: The Doctor Configuration
        echo # Edit these values to customize your experience
        echo.
        echo # Server Settings
        echo PORT=3001
        echo HOST=localhost
        echo NODE_ENV=production
        echo.
        echo # API Keys ^(Optional - The Doctor can run without these^)
        echo # Get OpenAI API key from: https://platform.openai.com/api-keys
        echo OPENAI_API_KEY=
        echo.
        echo # Get Gemini API key from: https://ai.google.dev/
        echo GEMINI_API_KEY=
        echo.
        echo # Get Anthropic API key from: https://console.anthropic.com/
        echo ANTHROPIC_API_KEY=
        echo.
        echo # Features
        echo FEATURE_COMICS=true
        echo FEATURE_OFFLINE=false
        echo.
        echo # The Doctor Settings
        echo DOCTOR_HUMOR_LEVEL=7
        echo DOCTOR_CHARACTER_ROTATION=true
    ) > .env
    echo ✅ Configuration created: .env
) else (
    echo ✅ Configuration already exists: .env
)

REM Create desktop shortcut
echo 🔗 Creating desktop shortcut...
set "shortcut=%USERPROFILE%\Desktop\AI Mastery - The Doctor.lnk"
set "target=%CD%\launcher.bat"
set "workdir=%CD%"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcut%'); $Shortcut.TargetPath = '%target%'; $Shortcut.WorkingDirectory = '%workdir%'; $Shortcut.Save()" >nul 2>&1

if exist "%shortcut%" (
    echo ✅ Desktop shortcut created
) else (
    echo ⚠️ Could not create desktop shortcut
)

echo.
echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo The Doctor is ready to begin training.
echo.
echo To start:
echo 1. Double-click the desktop shortcut, OR
echo 2. Run launcher.bat from this folder
echo.
echo To add API keys:
echo 1. Edit the .env file
echo 2. Add your OpenAI, Gemini, or Anthropic API keys
echo 3. Restart The Doctor
echo.
echo Without API keys, The Doctor runs in simulation mode.
echo.
echo 🖖 Live long and prosper!
echo.
pause

REM =============================================================================
REM Portable Launcher (save as portable-launcher.bat)
REM =============================================================================

@echo off
echo.
echo ============================================
echo   AI Mastery: The Doctor - PORTABLE
echo ============================================
echo.

REM This launcher can be run from any location
REM It will check for and install Node.js if needed

REM Get script directory
for %%F in ("%~dp0") do set "script_dir=%%~fF"
cd /d "%script_dir%"

echo Running from: %script_dir%
echo.

REM Check for portable Node.js first
if exist "node\node.exe" (
    echo ✅ Using portable Node.js
    set "PATH=%script_dir%node;%PATH%"
    set "NODE_PATH=%script_dir%node\node_modules"
) else (
    REM Check system Node.js
    node --version >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ❌ Node.js not found
        echo.
        echo This portable version needs Node.js to run.
        echo.
        echo Options:
        echo 1. Install Node.js from: https://nodejs.org/
        echo 2. Download portable Node.js bundle
        echo.
        pause
        exit /b 1
    )
    echo ✅ Using system Node.js
)

REM Check package.json
if not exist "package.json" (
    echo ❌ ERROR: AI Mastery files not found
    echo Make sure all files are in the same folder
    pause
    exit /b 1
)

REM Install if needed
if not exist "node_modules" (
    echo 📦 Setting up for first run...
    npm install --production
)

REM Setup config
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
    ) else (
        echo NODE_ENV=production > .env
        echo PORT=3001 >> .env
    )
)

echo.
echo 🚀 Starting The Doctor (Portable Mode)...
echo.

npm start

echo.
echo Session ended.
pause