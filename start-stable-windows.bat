@echo off
echo Starting MeDocPro Application with Stable Backend...
echo.

REM Enable error handling - don't exit on first error
setlocal EnableDelayedExpansion

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
    venv-windows\Scripts\python.exe -m pip install requests psutil  
)

echo Installing/updating psutil for enhanced stability...
venv-windows\Scripts\python.exe -m pip install psutil --upgrade

echo Initializing database...
venv-windows\Scripts\python.exe manage.py init-database
if errorlevel 1 (
    echo WARNING: Database initialization failed. Check your database configuration.
    echo Continuing startup - the application may not work correctly.
    pause
)

echo Checking for patient data migration...
if exist "patient_data.json" (
    echo Migrating patient data from file to database...
    venv-windows\Scripts\python.exe migrate_patient_data.py
    if errorlevel 1 (
        echo Patient data migration failed, but continuing startup...
    ) else (
        echo Patient data migration completed successfully.
    )
) else (
    echo No patient data file found. Using default database setup.
)

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

echo Starting super stable backend manager with enhanced crash prevention...
if not exist "venv-windows\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found!
    echo Please ensure the virtual environment was created successfully.
    pause
    exit /b 1
)

if not exist "start-super-stable-backend.py" (
    echo ERROR: start-super-stable-backend.py not found!
    echo Please ensure you are running from the correct directory.
    pause
    exit /b 1
)

start "MeDocPro Super Stable Backend" cmd /k "echo Starting Super Stable Backend Manager... && venv-windows\Scripts\python.exe start-super-stable-backend.py"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo Starting React frontend on port 5173...
if not exist "medocpro-dashboard" (
    echo ERROR: medocpro-dashboard directory not found!
    echo Please ensure you are running from the correct project directory.
    pause
    exit /b 1
)

cd medocpro-dashboard
if not exist "package.json" (
    echo ERROR: package.json not found in medocpro-dashboard directory!
    echo Please ensure the frontend is properly set up.
    pause
    exit /b 1
)

start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo MeDocPro Application Starting...
echo ================================================
echo Super Stable Backend: http://localhost:5000 (enhanced stability)
echo Frontend:           http://localhost:5173
echo Ollama AI Server:   http://localhost:11434
echo Backend Logs:       super-stable-backend.log
echo.
echo The super stable backend manager will automatically:
echo - Monitor backend health every 60 seconds
echo - Restart backend if it crashes or becomes unresponsive
echo - Kill conflicting processes on port 5000
echo - Use production server (Waitress) when available
echo - Log all activities to super-stable-backend.log
echo - Migrate patient data from patient_data.json to database if available
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
echo.
echo All services should now be starting in separate windows.
echo If you encounter any issues, check the error messages above.
echo.
echo Press any key to close this window...
pause