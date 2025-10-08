@echo off
REM Check current AI backend configuration

echo.
echo ================================================
echo 📊 MeDocPro AI Backend Status
echo ================================================
echo.

powershell -ExecutionPolicy Bypass -File Switch-AIBackend.ps1 -Backend status

echo.
echo ================================================
echo 🔄 Available Actions:
echo ================================================
echo.
echo   switch-to-ollama.bat     - Switch to Ollama
echo   switch-to-llama.bat      - Switch to llama-server  
echo   dev-start.bat            - Start with Ollama
echo   dev-start-llama.bat      - Start with llama-server
echo.

pause