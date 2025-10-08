@echo off
REM Model download script for MeDocPro (Windows)

setlocal

echo.
echo ================================================
echo 📚 MeDocPro Model Downloader
echo ================================================
echo.

if "%1"=="" (
    echo Usage:
    echo   download-models.bat recommended    - Download recommended models
    echo   download-models.bat list           - List available models
    echo   download-models.bat status         - Show download status
    echo   download-models.bat mistral-7b-instruct - Download specific model
    echo.
    pause
    exit /b 1
)

REM Run Python download script
python scripts\download-models.py %1

if %errorlevel% neq 0 (
    echo.
    echo ❌ Download failed with error code %errorlevel%
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Download completed successfully!
echo.
pause