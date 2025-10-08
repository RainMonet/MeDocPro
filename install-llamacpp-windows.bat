@echo off
REM llama.cpp Installation for Windows (MeDocPro Migration)

setlocal enabledelayedexpansion

echo.
echo ==================================================
echo 🚀 llama.cpp Installation for MeDocPro (Windows)
echo ==================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+ first.
    echo 📋 Download from: https://python.org/downloads
    pause
    exit /b 1
)

REM Check internet connectivity
ping -n 1 github.com >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Internet connection required for download
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Run Python installation script
echo 🔄 Running llama.cpp binary installer...
python scripts\install-llamacpp-binary.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ Installation failed
    echo 💡 Try running as Administrator or check internet connection
    pause
    exit /b 1
)

echo.
echo ================================================
echo ✅ llama.cpp Installation Complete!
echo ================================================
echo.
echo 📋 Next Steps:
echo   1. Download models: download-models.bat recommended
echo   2. Start development: dev-start-llama.bat
echo   3. Test migration: python test_llama_migration.py
echo.

pause