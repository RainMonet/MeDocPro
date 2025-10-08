@echo off
REM Switch MeDocPro to use llama-server backend

echo.
echo ================================================
echo 🦙 Switching to llama-server Backend
echo ================================================
echo.

powershell -ExecutionPolicy Bypass -File Switch-AIBackend.ps1 -Backend llama-server

if %errorlevel% neq 0 (
    echo.
    echo ❌ Switch failed with error code %errorlevel%
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ================================================
echo ✅ Successfully switched to llama-server!
echo ================================================
echo.
echo 📋 Next steps:
echo   1. Download model: download-models.bat recommended
echo   2. Start MeDocPro: dev-start-llama.bat
echo.

pause