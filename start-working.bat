@echo off
echo ================================================
echo 🚀 MeDocPro Working Startup Script
echo ================================================
echo This script starts MeDocPro with:
echo - Real database with all your data
echo - Working CORS configuration  
echo - All 3 users and patient census preserved
echo ================================================
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
)

echo 🔧 Updating API configuration...
echo const API_BASE_URL = 'http://192.168.1.138:5002'; > medocpro-dashboard\src\services\api_url_temp.txt
powershell -Command "(Get-Content medocpro-dashboard\src\services\api.js) -replace 'const API_BASE_URL = ''.*'';', 'const API_BASE_URL = ''http://192.168.1.138:5002'';' | Set-Content medocpro-dashboard\src\services\api.js"

echo 🗄️ Checking database...
venv-windows\Scripts\python.exe manage.py check-database
if errorlevel 1 (
    echo WARNING: Database check failed. Initializing...
    venv-windows\Scripts\python.exe manage.py init-database
)

echo 🚀 Starting working backend with real data...
start "MeDocPro Working Backend" cmd /k "echo Starting backend with CORS fixes... && venv-windows\Scripts\python.exe start-working-backend.py"

echo ⏳ Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo 🌐 Starting React frontend...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo ✅ MeDocPro Started Successfully!
echo ================================================
echo 🔗 Frontend:  http://localhost:5173
echo 🔗 Backend:   http://192.168.1.138:5002  
echo 👤 Login:     demo@medocpro.com / demo123
echo ================================================
echo.
echo Both services are starting in separate windows.
echo Wait a moment, then open http://localhost:5173
echo.
echo Press any key to close this window...
pause