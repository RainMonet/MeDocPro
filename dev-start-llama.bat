@echo off
REM MeDocPro Development Startup with llama-server (Windows)
REM Replaces Ollama with llama.cpp for improved stability

setlocal enabledelayedexpansion

echo.
echo ==================================================
echo 🚀 MeDocPro Development Server (llama.cpp)
echo ==================================================
echo ✅ Hot reloading: ENABLED
echo ✅ Debug mode: ON  
echo ✅ AI Backend: llama-server (replaces Ollama)
echo ✅ Database: Real data preserved
echo ==================================================
echo.

REM Configuration
set BACKEND_PORT=5000
set LLAMA_PORT=8080
set FRONTEND_PORT=5173

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+ and add to PATH.
    pause
    exit /b 1
)

REM Check if Node.js is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js/npm not found. Please install Node.js and add to PATH.
    pause
    exit /b 1
)

REM Check if llama-server binary exists
set LLAMA_SERVER=C:\Users\admin\Desktop\MeDocPro\llama.cpp\build\bin\llama-server.exe
if not exist "%LLAMA_SERVER%" (
    echo ❌ llama-server not found. Installing...
    echo.
    python scripts\install-llamacpp-binary.py
    if !errorlevel! neq 0 (
        echo ❌ llama-server installation failed
        pause
        exit /b 1
    )
)

REM Check if model exists
set MODEL_PATH=C:\Users\admin\Desktop\MeDocPro\models\mistral-7b-instruct-v0.3.Q4_K_M.gguf
if not exist "%MODEL_PATH%" (
    echo ⚠️  Model not found. Downloading...
    echo.
    call download-models.bat recommended
    if !errorlevel! neq 0 (
        echo ❌ Model download failed
        pause
        exit /b 1
    )
)

REM Kill any existing processes on our ports
echo 🔄 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%LLAMA_PORT% ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 🤖 Starting llama-server...
start "llama-server" /min cmd /c "start-llama-server.bat"

REM Wait for llama-server to start
echo ⏳ Waiting for llama-server to initialize...
timeout /t 5 /nobreak >nul

REM Verify llama-server is running
curl -s http://localhost:%LLAMA_PORT%/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ llama-server started successfully
) else (
    echo ⚠️  llama-server starting (may take a moment for model loading)
)

echo.
echo 🔧 Starting MeDocPro backend...
start "MeDocPro Backend" cmd /c "python dev-start.py"

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting frontend development server...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /c "npm run dev"

echo.
echo ================================================
echo 🎉 MeDocPro Development Environment Started!
echo ================================================
echo.
echo 📍 Access Points:
echo   🌐 Frontend:  http://localhost:%FRONTEND_PORT%
echo   🔧 Backend:   http://localhost:%BACKEND_PORT%
echo   🤖 AI Server: http://localhost:%LLAMA_PORT%
echo.
echo 📊 Health Checks:
echo   Backend:  http://localhost:%BACKEND_PORT%/health
echo   AI:       http://localhost:%LLAMA_PORT%/health
echo.
echo 🔑 Demo Credentials:
echo   Username: demo@medocpro.com
echo   Password: demo123
echo.
echo 🛑 To stop all services: Press Ctrl+C or close this window
echo.

REM Keep window open and monitor
echo 📱 Monitoring services... (Press Ctrl+C to stop all)
pause >nul