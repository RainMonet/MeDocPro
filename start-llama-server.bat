@echo off
REM llama-server startup script for MeDocPro (Windows)
REM Auto-generated for Windows PowerShell environment

setlocal

set LLAMA_SERVER=C:\Users\admin\Desktop\MeDocPro\llama.cpp\build\bin\llama-server.exe
set MODELS_DIR=C:\Users\admin\Desktop\MeDocPro\models
set PORT=8080
set HOST=127.0.0.1
set MODEL_PATH=%MODELS_DIR%\mistral-7b-instruct-v0.3.Q4_K_M.gguf

echo.
echo ================================================
echo 🚀 MeDocPro llama-server Startup
echo ================================================

REM Check if model exists
if not exist "%MODEL_PATH%" (
    echo ❌ Model not found: %MODEL_PATH%
    echo 📋 Run: python scripts\download-models.py recommended
    echo.
    pause
    exit /b 1
)

echo ✅ Model found: %MODEL_PATH%
echo 🌐 Starting server at: http://%HOST%:%PORT%
echo.

REM Start llama-server with Windows paths
"%LLAMA_SERVER%" ^
    --model "%MODEL_PATH%" ^
    --host %HOST% ^
    --port %PORT% ^
    --ctx-size 4096 ^
    --n-predict 512 ^
    --threads 4 ^
    --batch-size 512 ^
    --verbose

echo.
echo Server stopped.
pause