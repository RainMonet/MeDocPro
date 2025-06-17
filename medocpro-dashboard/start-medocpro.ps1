Write-Host "Starting MeDocPro Development Server..." -ForegroundColor Green

if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Make sure you're in the project directory." -ForegroundColor Red
    exit 1
}

if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    npm install
}

Write-Host "Launching MeDocPro..." -ForegroundColor Cyan
npm run dev

Write-Host "MeDocPro development server started!" -ForegroundColor Green
