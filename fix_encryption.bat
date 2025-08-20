@echo off
echo ==================================================
echo MeDocPro HIPAA Encryption Dependency Fix
echo ==================================================
echo.

echo Checking for required modules...
python -c "import cryptography, psutil; print('All dependencies installed - Cryptography:', cryptography.__version__, 'PSUtil:', psutil.__version__)" 2>nul
if %errorlevel% == 0 (
    echo Success! All dependencies available.
    echo Starting MeDocPro...
    python dev-start.py
    goto :end
)

echo Required modules not found. Attempting to install...
echo.

echo Method 1: Installing with pip...
python -m pip install cryptography psutil
if %errorlevel% == 0 (
    echo Success! Testing dependencies...
    python -c "import cryptography, psutil; print('All dependencies installed successfully!')"
    if %errorlevel% == 0 (
        echo Starting MeDocPro...
        python dev-start.py
        goto :end
    )
)

echo.
echo Method 2: Installing with --break-system-packages...
python -m pip install cryptography psutil --break-system-packages
if %errorlevel% == 0 (
    echo Success! Testing dependencies...
    python -c "import cryptography, psutil; print('All dependencies installed successfully!')"
    if %errorlevel% == 0 (
        echo Starting MeDocPro...
        python dev-start.py
        goto :end
    )
)

echo.
echo All automatic installation methods failed.
echo.
echo You have two options:
echo 1. Install cryptography manually: pip install cryptography
echo 2. Disable encryption for development (NOT for production)
echo.
set /p choice="Disable encryption for development? (y/N): "
if /i "%choice%" == "y" (
    echo Disabling encryption...
    python install_encryption_deps.py
    if %errorlevel% == 0 (
        echo Starting MeDocPro without encryption...
        python dev-start.py
    )
) else (
    echo Please install cryptography manually or use WSL/Linux environment.
    echo See ENCRYPTION_SETUP.md for detailed instructions.
)

:end
echo.
echo Press any key to exit...
pause >nul