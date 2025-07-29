@echo off
REM =============================================================================
REM MeDocPro Docker Test Deployment Script for Windows
REM Cross-platform testing deployment for local development
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
set COMPOSE_FILE=docker-compose.test.yml
set PROJECT_NAME=medocpro-test
set DOCKER_PLATFORM=linux/amd64

echo.
echo ================================================
echo 🚀 MeDocPro Test Deployment (Windows)
echo ================================================

REM Check if Docker is installed
echo 🐳 Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed
    echo Please install Docker Desktop from https://docker.com/get-started
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed
    echo Please install Docker Compose
    pause
    exit /b 1
)

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker daemon is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is ready

REM Handle command line arguments
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
if "%1"=="clean" goto clean_all

REM Main deployment process
echo.
echo 🧹 Cleaning up previous deployment...
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% down -v --remove-orphans >nul 2>&1

echo.
echo 🏗️ Building and starting services...
echo This may take several minutes on first run...

REM Build with no cache
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% build --no-cache
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

REM Start services
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% up -d
if errorlevel 1 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo ✅ Services started

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Health checks
echo.
echo 🏥 Performing health checks...

set /a checks_passed=0
set /a total_checks=4

REM Backend API health check
curl -sf http://localhost:5000/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ Backend API
    set /a checks_passed+=1
) else (
    echo ❌ Backend API
)

REM Frontend health check
curl -sf http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo ✅ Frontend
    set /a checks_passed+=1
) else (
    echo ❌ Frontend
)

REM Database health check
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% exec -T postgres pg_isready -U medocpro -d medocpro_test >nul 2>&1
if not errorlevel 1 (
    echo ✅ Database
    set /a checks_passed+=1
) else (
    echo ❌ Database
)

REM Ollama health check
curl -sf http://localhost:11434/api/tags >nul 2>&1
if not errorlevel 1 (
    echo ✅ Ollama AI Service
    set /a checks_passed+=1
) else (
    echo ❌ Ollama AI Service
)

echo.
echo Health Check Results: !checks_passed!/!total_checks! services healthy

if !checks_passed! equ !total_checks! (
    goto show_success
) else (
    echo ❌ Some services failed health checks
    echo Check logs with: docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% logs
    pause
    exit /b 1
)

:show_success
echo.
echo 🤖 Available AI Models:
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% exec ollama ollama list 2>nul

echo.
echo ================================================
echo 🎉 MeDocPro Test Deployment Complete!
echo ================================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 🗄️ Database: postgresql://medocpro:medocpro_dev_pass@localhost:5432/medocpro_test
echo 🤖 Ollama AI: http://localhost:11434
echo 📊 Redis: redis://localhost:6379
echo.
echo 📋 Management Commands:
echo • View logs: test-deploy.bat logs
echo • Stop services: test-deploy.bat stop
echo • Restart services: test-deploy.bat restart
echo • Service status: test-deploy.bat status
echo • Clean all: test-deploy.bat clean
echo.
echo ✨ Ready for testing!
echo.
pause
goto end

:stop_services
echo 🛑 Stopping MeDocPro test deployment...
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% down
echo ✅ Stopped
goto end

:restart_services
echo 🔄 Restarting MeDocPro test deployment...
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% restart
echo ✅ Restarted
goto end

:show_logs
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% logs -f
goto end

:show_status
echo 📊 Service Status:
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% ps
echo.
echo 🏥 Health Checks:
curl -sf http://localhost:5000/health >nul 2>&1 && echo ✅ Backend API || echo ❌ Backend API
curl -sf http://localhost:3000 >nul 2>&1 && echo ✅ Frontend || echo ❌ Frontend
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% exec -T postgres pg_isready -U medocpro -d medocpro_test >nul 2>&1 && echo ✅ Database || echo ❌ Database
curl -sf http://localhost:11434/api/tags >nul 2>&1 && echo ✅ Ollama AI Service || echo ❌ Ollama AI Service
goto end

:clean_all
echo 🧹 Performing deep clean...
docker-compose -f %COMPOSE_FILE% -p %PROJECT_NAME% down -v --remove-orphans
docker system prune -f
echo ✅ Deep clean complete
goto end

:end
endlocal