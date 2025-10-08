@echo off
REM Switch MeDocPro to use Ollama backend

echo.
echo ================================================
echo 🔄 Switching to Ollama Backend
echo ================================================
echo.

powershell -ExecutionPolicy Bypass -File Switch-AIBackend.ps1 -Backend ollama

if %errorlevel% neq 0 (
    echo.
    echo ❌ Switch failed with error code %errorlevel%
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ================================================
echo ✅ Successfully switched to Ollama!
echo ================================================
echo.
echo 📋 Next steps:
echo   1. Start Ollama: ollama serve
echo   2. Pull model: ollama pull mistral
echo   3. Start MeDocPro: dev-start.bat
echo.

pause