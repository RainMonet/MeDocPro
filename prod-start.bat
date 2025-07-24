@echo off
echo ================================================
echo 🚀 MeDocPro Production Environment
echo ================================================
echo Setting up production environment...
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements.txt
    venv-windows\Scripts\python.exe -m pip install waitress
)

echo Installing/updating Waitress...
venv-windows\Scripts\python.exe -m pip install waitress --upgrade

echo Updating API configuration for production...
echo const API_BASE_URL = 'http://localhost:5000'; > medocpro-dashboard\src\services\api_url_temp.txt
powershell -Command "(Get-Content medocpro-dashboard\src\services\api.js) -replace 'const API_BASE_URL = ''.*'';', 'const API_BASE_URL = ''http://localhost:5000'';' | Set-Content medocpro-dashboard\src\services\api.js"

echo Checking database...
venv-windows\Scripts\python.exe manage.py check-database
if errorlevel 1 (
    echo Initializing database...
    venv-windows\Scripts\python.exe manage.py init-database
)

echo Building React frontend for production...
cd medocpro-dashboard
call npm run build
if errorlevel 1 (
    echo Frontend build failed. Starting development server instead...
    start "MeDocPro Frontend (Dev)" cmd /k "npm run dev"
) else (
    echo Frontend built successfully!
    start "MeDocPro Frontend (Preview)" cmd /k "npm run preview"
)
cd ..

echo Starting production backend...
start "MeDocPro Production Backend" cmd /k "venv-windows\Scripts\python.exe prod-start.py"

echo.
echo ================================================
echo ✅ MeDocPro Production Started!
echo ================================================
echo 🔗 Frontend:  http://localhost:4173 (production) or 5173 (dev fallback)
echo 🔗 Backend:   http://localhost:5000 (Waitress WSGI)
echo 👤 Login:     demo@medocpro.com / demo123
echo ================================================
echo.
echo Production backend uses Waitress WSGI server.
echo For code changes, restart the backend manually.
echo ================================================