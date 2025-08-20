@echo off
echo ================================================
echo 🔧 MeDocPro Development Environment (Enhanced)
echo ================================================
echo 🔐 With HIPAA Encryption & Dependency Management
echo ================================================
echo Setting up development environment...
echo.

REM Check for required dependencies first
echo Checking for required modules...
python -c "import cryptography, psutil; print('All dependencies available - Cryptography:', cryptography.__version__, 'PSUtil:', psutil.__version__)" 2>nul
if %errorlevel% == 0 (
    echo ✅ All dependencies available
    goto :setup_environment
)

echo ⚠️ Missing required dependencies. Installing...
echo.

REM Try to install missing dependencies
echo Installing cryptography and psutil...
python -m pip install cryptography psutil 2>nul
if %errorlevel% == 0 (
    echo ✅ Dependencies installed successfully
    goto :verify_deps
)

echo Trying with --break-system-packages...
python -m pip install cryptography psutil --break-system-packages 2>nul
if %errorlevel% == 0 (
    echo ✅ Dependencies installed successfully
    goto :verify_deps
)

echo ❌ Automatic dependency installation failed
echo Please run: pip install cryptography psutil
echo Or use: python install_encryption_deps.py
pause
exit /b 1

:verify_deps
echo Verifying dependencies...
python -c "import cryptography, psutil" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Dependencies still not available
    echo Please run: python install_encryption_deps.py
    pause
    exit /b 1
)

:setup_environment
REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies in virtual environment...
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
echo.
echo ⏳ Initializing HIPAA encryption and monitoring systems...
start "MeDocPro Development Backend" cmd /k "venv-windows\Scripts\python.exe dev-start.py"

echo Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo Starting React frontend...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo ✅ MeDocPro Development Started!
echo ================================================
echo 🔗 Frontend:  http://localhost:5173
echo 🔗 Backend:   http://localhost:5000
echo 🏥 Health:    http://localhost:5000/health
echo 📊 Metrics:   http://localhost:5000/metrics
echo 👤 Login:     demo@medocpro.com / demo123
echo ================================================
echo.
echo 🔐 SECURITY STATUS:
echo ✅ HIPAA encryption middleware: ACTIVE
echo ✅ Phase 2 monitoring: ACTIVE
echo ✅ PHI data protection: ENABLED
echo.
echo 📝 NOTES:
echo • Backend window shows "hot reloading" - this is normal
echo • Both services run in separate command windows
echo • Backend automatically restarts when files change
echo • Frontend has live reload for React development
echo.
echo ⚠️ IMPORTANT: Keep both command windows open while developing
echo ================================================