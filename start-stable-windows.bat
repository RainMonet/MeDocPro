@echo off
echo Starting MeDocPro Application with Stable Backend...
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
    venv-windows\Scripts\python.exe -m pip install requests  
)

echo Initializing database...
venv-windows\Scripts\python.exe manage.py init-database

echo Starting stable backend manager with auto-restart capabilities...
start "MeDocPro Stable Backend" cmd /k "echo Starting Stable Backend Manager... && venv-windows\Scripts\python.exe start-stable-backend.py"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo Starting React frontend on port 5173...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo MeDocPro Application Starting...
echo ================================================
echo Stable Backend: http://localhost:5000 (with auto-restart)
echo Frontend:       http://localhost:5173
echo Backend Logs:   backend-manager.log
echo.
echo The stable backend manager will automatically:
echo - Monitor backend health every 30 seconds
echo - Restart backend if it crashes or becomes unresponsive
echo - Log all activities to backend-manager.log
echo.
echo All services are starting in separate windows.
echo Wait a moment, then open http://localhost:5173 in your browser.
echo.
echo Login credentials:
echo Username: demo@medocpro.com
echo Password: demo123
echo ================================================
pause