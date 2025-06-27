@echo off
echo Starting MeDocPro Application...
echo.

REM Check if virtual environment exists
if not exist "venv-windows" (
    echo Creating virtual environment...
    py -m venv venv-windows
    echo Installing dependencies...
    venv-windows\Scripts\python.exe -m pip install --upgrade pip
    venv-windows\Scripts\python.exe -m pip install -r requirements-minimal.txt
)

echo Initializing database...
venv-windows\Scripts\python.exe init_db.py

echo Starting Flask backend on port 5000...
start "MeDocPro Backend" cmd /k "venv-windows\Scripts\python.exe app.py"

echo Starting development backend on port 5001 (for clinical workflow)...
start "MeDocPro Dev Backend" cmd /k "venv-windows\Scripts\python.exe simple_backend.py"

echo Waiting for backends to start...
timeout /t 5 /nobreak > nul

echo Starting React frontend on port 5173...
cd medocpro-dashboard
start "MeDocPro Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo MeDocPro Application Starting...
echo ================================================
echo Backend:     http://localhost:5000
echo Dev Backend: http://localhost:5001 (clinical workflow)
echo Frontend:    http://localhost:5173
echo.
echo All services are starting in separate windows.
echo Wait a moment, then open http://localhost:5173 in your browser.
echo.
echo Login credentials:
echo Username: admin
echo Password: ChangeMe123!
echo ================================================
pause