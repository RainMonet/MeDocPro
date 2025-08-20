@echo off
echo Starting MeDocPro with Production Backend...
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
)

REM Ensure Waitress is installed
echo Checking Waitress installation...
venv-windows\Scripts\python.exe -c "import waitress" 2>nul
if errorlevel 1 (
    echo Installing Waitress WSGI server...
    venv-windows\Scripts\python.exe -m pip install waitress
)

echo Initializing database...
venv-windows\Scripts\python.exe manage.py init-database

REM Check if Ollama is available and start it
echo Checking for Ollama...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Ollama is not installed or not in PATH
    echo AI enhancement features will not be available
    echo You can install Ollama from https://ollama.ai
    echo.
) else (
    echo Checking if Ollama server is already running...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -TimeoutSec 2 -UseBasicParsing | Out-Null; Write-Host 'Ollama server is already running' } catch { Write-Host 'Starting Ollama server...'; Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Normal }"
    timeout /t 2 /nobreak > nul
)

echo Starting production backend (Waitress WSGI server)...
start "MeDocPro Production Backend" cmd /k "echo Starting Production Backend... && venv-windows\Scripts\python.exe start-simple-stable.py"

echo Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo Starting React frontend on port 5173...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo MeDocPro Application Starting...
echo ================================================
echo Production Backend: http://localhost:5000 (Waitress WSGI)
echo Frontend:          http://localhost:5173
echo Ollama AI Server:  http://localhost:11434
echo Backend Logs:      simple-stable.log
echo.
echo The production backend is much more stable than the development server.
echo It uses Waitress WSGI server which handles concurrent requests better.
echo.
echo AI Enhancement Features:
echo - If Ollama is running: Full AI text enhancement available
echo - If Ollama is missing: AI features will be disabled
echo.
echo All services are starting in separate windows.
echo Wait a moment, then open http://localhost:5173 in your browser.
echo.
echo Login credentials:
echo Username: demo@medocpro.com
echo Password: demo123
echo ================================================
pause