# PowerShell AI Backend Switcher for MeDocPro
# Native Windows version

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("ollama", "llama-server", "status")]
    [string]$Backend
)

# Configuration
$ProjectDir = Get-Location
$EnvFile = Join-Path $ProjectDir ".env"
$BackupDir = Join-Path $ProjectDir "migration_backups"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

function Write-ColorText {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Backup-Configuration {
    param($BackendName)
    
    Write-ColorText "Backing up current $BackendName configuration..." "Yellow"
    
    $BackupSubDir = Join-Path $BackupDir "${BackendName}_config"
    if (-not (Test-Path $BackupSubDir)) {
        New-Item -ItemType Directory -Path $BackupSubDir -Force | Out-Null
    }
    
    # Backup .env file
    if (Test-Path $EnvFile) {
        $BackupEnv = Join-Path $BackupSubDir ".env"
        Copy-Item $EnvFile $BackupEnv -Force
        Write-ColorText "   Backed up .env" "Green"
    }
}

function Switch-ToOllama {
    Write-ColorText "Switching to Ollama configuration..." "Cyan"
    
    Backup-Configuration "llama_server"
    
    if (-not (Test-Path $EnvFile)) {
        Write-ColorText "   .env file not found" "Red"
        return
    }
    
    # Read current .env content
    $content = Get-Content $EnvFile -Raw
    
    # Comment out llama-server configs
    $content = $content -replace "LLAMA_SERVER_URL=", "# LLAMA_SERVER_URL="
    $content = $content -replace "LLAMA_MODEL_PATH=", "# LLAMA_MODEL_PATH="
    $content = $content -replace "LLAMA_THREADS=", "# LLAMA_THREADS="
    $content = $content -replace "LLAMA_CONTEXT_SIZE=", "# LLAMA_CONTEXT_SIZE="
    
    # Activate Ollama configs
    if ($content -notmatch "OLLAMA_URL=") {
        $content += "`n# Ollama Configuration (Active)`n"
        $content += "OLLAMA_URL=http://localhost:11434`n"
        $content += "OLLAMA_MODEL=mistral:latest`n"
    } else {
        $content = $content -replace "# OLLAMA_URL=", "OLLAMA_URL="
        $content = $content -replace "# OLLAMA_MODEL=", "OLLAMA_MODEL="
    }
    
    # Write back to file
    $content | Set-Content $EnvFile -NoNewline
    
    Write-ColorText "Successfully switched to Ollama configuration" "Green"
    Write-ColorText "" "White"
    Write-ColorText "To use Ollama:" "Yellow"
    Write-ColorText "   1. Start Ollama: ollama serve" "White"
    Write-ColorText "   2. Pull model: ollama pull mistral" "White"
    Write-ColorText "   3. Start MeDocPro: .\dev-start.bat" "White"
}

function Switch-ToLlamaServer {
    Write-ColorText "Switching to llama-server configuration..." "Cyan"
    
    Backup-Configuration "ollama"
    
    if (-not (Test-Path $EnvFile)) {
        Write-ColorText "   .env file not found" "Red"
        return
    }
    
    # Read current .env content
    $content = Get-Content $EnvFile -Raw
    
    # Comment out Ollama configs
    $content = $content -replace "OLLAMA_URL=", "# OLLAMA_URL="
    $content = $content -replace "OLLAMA_MODEL=", "# OLLAMA_MODEL="
    
    # Activate llama-server configs
    $modelPath = "C:/Users/admin/Desktop/MeDocPro/models/mistral-7b-instruct-v0.3.Q4_K_M.gguf"
    
    if ($content -notmatch "LLAMA_SERVER_URL=") {
        $content += "`n# llama.cpp Configuration (Active)`n"
        $content += "LLAMA_SERVER_URL=http://localhost:8080`n"
        $content += "LLAMA_MODEL_PATH=$modelPath`n"
        $content += "LLAMA_THREADS=4`n"
        $content += "LLAMA_CONTEXT_SIZE=4096`n"
    } else {
        $content = $content -replace "# LLAMA_SERVER_URL=", "LLAMA_SERVER_URL="
        $content = $content -replace "# LLAMA_MODEL_PATH=", "LLAMA_MODEL_PATH="
        $content = $content -replace "# LLAMA_THREADS=", "LLAMA_THREADS="
        $content = $content -replace "# LLAMA_CONTEXT_SIZE=", "LLAMA_CONTEXT_SIZE="
    }
    
    # Write back to file
    $content | Set-Content $EnvFile -NoNewline
    
    Write-ColorText "Successfully switched to llama-server configuration" "Green"
    Write-ColorText "" "White"
    Write-ColorText "To use llama-server:" "Yellow"
    Write-ColorText "   1. Download model: .\download-models.bat recommended" "White"
    Write-ColorText "   2. Start MeDocPro: .\dev-start-llama.bat" "White"
}

function Show-Status {
    Write-ColorText "Current AI Backend Configuration:" "Cyan"
    Write-ColorText "================================================" "Gray"
    
    if (-not (Test-Path $EnvFile)) {
        Write-ColorText ".env file not found" "Red"
        return
    }
    
    $content = Get-Content $EnvFile -Raw
    
    # Check active configurations
    $ollamaActive = ($content -match "OLLAMA_URL=http://localhost:11434") -and ($content -notmatch "# OLLAMA_URL=http://localhost:11434")
    $llamaActive = ($content -match "LLAMA_SERVER_URL=http://localhost:8080") -and ($content -notmatch "# LLAMA_SERVER_URL=http://localhost:8080")
    
    if ($ollamaActive) {
        Write-ColorText "Ollama: ACTIVE" "Green"
    } else {
        Write-ColorText "Ollama: Inactive" "Red"
    }
    
    if ($llamaActive) {
        Write-ColorText "llama-server: ACTIVE" "Green"
    } else {
        Write-ColorText "llama-server: Inactive" "Red"
    }
    
    if ($ollamaActive -and $llamaActive) {
        Write-ColorText "WARNING: Both backends are active - this may cause conflicts" "Yellow"
    } elseif (-not $ollamaActive -and -not $llamaActive) {
        Write-ColorText "WARNING: No AI backend is active" "Yellow"
    }
    
    # Show backup status
    Write-ColorText "" "White"
    Write-ColorText "Backups available:" "Yellow"
    if (Test-Path (Join-Path $BackupDir "ollama_config")) {
        Write-ColorText "   Ollama configuration backup" "Green"
    }
    if (Test-Path (Join-Path $BackupDir "llama_server_config")) {
        Write-ColorText "   llama-server configuration backup" "Green"
    }
}

# Main execution
switch ($Backend) {
    "ollama" {
        Switch-ToOllama
    }
    "llama-server" {
        Switch-ToLlamaServer
    }
    "status" {
        Show-Status
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -NoNewline
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
Write-Host ""