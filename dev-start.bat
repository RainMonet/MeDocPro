@echo off
echo ================================================
echo 🔧 MeDocPro Development Environment
echo ================================================
echo Setting up development environment...
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
)

echo Updating API configuration for development...
echo const API_BASE_URL = 'http://localhost:5000'; > medocpro-dashboard\src\services\api_url_temp.txt
powershell -Command "(Get-Content medocpro-dashboard\src\services\api.js) -replace 'const API_BASE_URL = ''.*'';', 'const API_BASE_URL = ''http://localhost:5000'';' | Set-Content medocpro-dashboard\src\services\api.js"

echo Checking database...
venv-windows\Scripts\python.exe manage.py check-database
if errorlevel 1 (
    echo Initializing database...
    venv-windows\Scripts\python.exe manage.py init-database
)

echo Starting development backend...
start "MeDocPro Development Backend" cmd /k "venv-windows\Scripts\python.exe dev-start.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting React frontend...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo ✅ MeDocPro Development Started!
echo ================================================
echo 🔗 Frontend:  http://localhost:5173
echo 🔗 Backend:   http://localhost:5000
echo 👤 Login:     demo@medocpro.com / demo123
echo ================================================
echo.
echo Both services are starting in separate windows.
echo Backend has hot reloading - changes take effect immediately.
echo ================================================