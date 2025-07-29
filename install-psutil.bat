@echo off
echo Installing psutil for enhanced backend stability...
echo.

REM Try to install psutil using the virtual environment
if exist "venv-windows\Scripts\python.exe" (
    echo Using virtual environment Python...
    venv-windows\Scripts\python.exe -m pip install psutil --upgrade
    echo.
    echo psutil installed successfully in virtual environment!
) else (
    echo Virtual environment not found, using system Python...
    py -m pip install psutil --upgrade
    echo.
    echo psutil installed successfully in system Python!
)

echo.
echo You can now run start-stable-windows.bat or start-super-stable-backend.py
echo.
pause