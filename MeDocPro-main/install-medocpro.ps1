# MeDocPro Dashboard - Quick PowerShell Setup Script
# Save this as "install-medocpro.ps1" and run in PowerShell

param(
    [string]$InstallPath = "C:\MeDocPro",
    [string]$ZipPath = "$env:USERPROFILE\Downloads\medocpro-dashboard-windows.zip",
    [switch]$SkipExtraction,
    [switch]$OpenBrowser
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host @"
🏥 ===================================
   MeDocPro Dashboard Installer
   Clinical Documentation System
===================================
"@ -ForegroundColor Cyan

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install Node.js if not present
function Install-NodeJS {
    Write-Host "📦 Node.js not found. Downloading installer..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        Write-Host "🚀 Starting Node.js installation..." -ForegroundColor Green
        Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet" -Wait
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ Node.js installation completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download/install Node.js: $_" -ForegroundColor Red
        Write-Host "Please manually install Node.js from https://nodejs.org" -ForegroundColor Yellow
        exit 1
    }
}

# Step 1: Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    if (Test-Administrator) {
        Install-NodeJS
    } else {
        Write-Host "❌ Node.js not found and not running as administrator" -ForegroundColor Red
        Write-Host "Please either:" -ForegroundColor Yellow
        Write-Host "  1. Install Node.js manually from https://nodejs.org" -ForegroundColor Yellow
        Write-Host "  2. Run this script as Administrator" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Create project directory
Write-Host "📁 Creating project directory at $InstallPath..." -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Set-Location $InstallPath
    Write-Host "✅ Project directory created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create directory: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Extract archive
if (-not $SkipExtraction) {
    Write-Host "📦 Extracting dashboard archive..." -ForegroundColor Yellow
    
    if (Test-Path $ZipPath) {
        try {
            Expand-Archive -Path $ZipPath -DestinationPath $InstallPath -Force
            Write-Host "✅ Archive extracted successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to extract archive: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Archive not found at $ZipPath" -ForegroundColor Red
        Write-Host "Please download medocpro-dashboard-windows.zip to your Downloads folder" -ForegroundColor Yellow
        Write-Host "Or use -SkipExtraction if files are already extracted" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Navigate to project directory
$projectPath = Join-Path $InstallPath "medocpro-dashboard"
if (Test-Path $projectPath) {
    Set-Location $projectPath
    Write-Host "✅ Navigated to project directory" -ForegroundColor Green
} else {
    Write-Host "❌ Project directory not found at $projectPath" -ForegroundColor Red
    exit 1
}

# Step 5: Install pnpm
Write-Host "📦 Installing pnpm package manager..." -ForegroundColor Yellow
try {
    npm install -g pnpm --silent
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm version: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ pnpm installation failed, will use npm instead" -ForegroundColor Yellow
}

# Step 6: Install dependencies
Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
    } else {
        npm install
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Create environment file
Write-Host "⚙️ Setting up environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env" -Force
    Write-Host "✅ Environment file created" -ForegroundColor Green
} else {
    # Create basic .env file
    @"
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=MeDocPro Dashboard
VITE_ENABLE_HEALTH_CHECK=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Basic environment file created" -ForegroundColor Green
}

# Step 8: Build production version
Write-Host "🔨 Building production version..." -ForegroundColor Yellow
try {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm run build
    } else {
        npm run build
    }
    Write-Host "✅ Production build completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Production build failed, but development mode will still work" -ForegroundColor Yellow
}

# Step 9: Create startup scripts
Write-Host "📝 Creating startup scripts..." -ForegroundColor Yellow

# Create start-dev.ps1
@"
# MeDocPro Dashboard - Development Server
Set-Location "$projectPath"
Write-Host "🚀 Starting MeDocPro Dashboard..." -ForegroundColor Green
Write-Host "Dashboard will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run dev
} else {
    npm run dev
}
"@ | Out-File -FilePath "$InstallPath\start-dev.ps1" -Encoding UTF8

# Create start-prod.ps1
@"
# MeDocPro Dashboard - Production Server
Set-Location "$projectPath"
Write-Host "🚀 Starting MeDocPro Dashboard (Production)..." -ForegroundColor Green
Write-Host "Dashboard will be available at: http://localhost:4173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run preview
} else {
    npm run preview
}
"@ | Out-File -FilePath "$InstallPath\start-prod.ps1" -Encoding UTF8

Write-Host "✅ Startup scripts created" -ForegroundColor Green

# Final success message
Write-Host @"

🎉 ===================================
   Installation Completed Successfully!
===================================

📁 Installation Location: $InstallPath
🌐 Project Directory: $projectPath

🚀 To start the dashboard:

   Development Mode:
   PowerShell $InstallPath\start-dev.ps1
   
   Production Mode:
   PowerShell $InstallPath\start-prod.ps1

   Manual Commands:
   cd "$projectPath"
   pnpm run dev    # Development
   pnpm run build  # Build production
   pnpm run preview # Serve production

🌐 URLs:
   Development: http://localhost:5173
   Production:  http://localhost:4173

📋 Next Steps:
   1. Start the development server
   2. Open browser to http://localhost:5173
   3. Configure backend API URL in .env file
   4. Enjoy your MeDocPro dashboard!

"@ -ForegroundColor Green

# Optionally open browser
if ($OpenBrowser) {
    Write-Host "🌐 Starting development server and opening browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:5173"
    
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm run dev
    } else {
        npm run dev
    }
}

Write-Host "Installation script completed! 🎉" -ForegroundColor Cyan

