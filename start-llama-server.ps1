# llama-server startup script for MeDocPro (PowerShell)
# Auto-generated for Windows PowerShell environment

param(
    [string]$ModelPath = "",
    [int]$Port = 8080,
    [string]$Host = "127.0.0.1",
    [int]$Threads = 4
)

# Configuration
$LLAMA_SERVER = "C:\Users\admin\Desktop\MeDocPro\llama.cpp\build\bin\llama-server.exe"
$MODELS_DIR = "C:\Users\admin\Desktop\MeDocPro\models"
$DEFAULT_MODEL = "$MODELS_DIR\mistral-7b-instruct-v0.3.Q4_K_M.gguf"

# Use provided model path or default
if ($ModelPath -eq "") {
    $ModelPath = $DEFAULT_MODEL
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 MeDocPro llama-server Startup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if llama-server binary exists
if (-not (Test-Path $LLAMA_SERVER)) {
    Write-Host "❌ llama-server not found: $LLAMA_SERVER" -ForegroundColor Red
    Write-Host "📋 Run: python scripts\install-llamacpp-binary.py" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if model exists
if (-not (Test-Path $ModelPath)) {
    Write-Host "❌ Model not found: $ModelPath" -ForegroundColor Red
    Write-Host "📋 Run: python scripts\download-models.py recommended" -ForegroundColor Yellow
    Write-Host ""
    
    # List available models
    if (Test-Path $MODELS_DIR) {
        $models = Get-ChildItem $MODELS_DIR -Filter "*.gguf"
        if ($models.Count -gt 0) {
            Write-Host "📚 Available models:" -ForegroundColor Yellow
            foreach ($model in $models) {
                Write-Host "   - $($model.Name)" -ForegroundColor Gray
            }
        }
    }
    
    Read-Host "Press Enter to exit"
    exit 1
}

# Display startup information
Write-Host "✅ llama-server: $LLAMA_SERVER" -ForegroundColor Green
Write-Host "✅ Model: $ModelPath" -ForegroundColor Green
Write-Host "🌐 Server: http://$Host`:$Port" -ForegroundColor Cyan
Write-Host "🧵 Threads: $Threads" -ForegroundColor Gray
Write-Host ""
Write-Host "🔥 Starting llama-server..." -ForegroundColor Yellow

try {
    # Start llama-server
    & $LLAMA_SERVER `
        --model $ModelPath `
        --host $Host `
        --port $Port `
        --ctx-size 4096 `
        --n-predict 512 `
        --threads $Threads `
        --batch-size 512 `
        --verbose
} catch {
    Write-Host ""
    Write-Host "❌ Error starting llama-server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"