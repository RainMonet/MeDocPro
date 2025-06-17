# MeDocPro Setup Script for Windows
# Usage:
#   .\setup.ps1              - Sets up a local development environment without Docker.
#   .\setup.ps1 -Docker      - Sets up a production-like environment using Docker.
#   .\setup.ps1 -Docker -Gpu - Sets up a production-like environment using Docker with GPU support for Ollama.
#   .\setup.ps1 -SkipPrereqs - Skips the prerequisite checks.

param (
    [switch]$Docker,
    [switch]$Gpu,
    [switch]$SkipPrereqs,
    [switch]$Help
)

# --- Helper Functions for Colored Output ---
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Exit-Script {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

# --- Show Help ---
if ($Help) {
    Write-Info "MeDocPro Setup Script Help:"
    Write-Host "
Usage:
    .\setup.ps1
        Sets up a local development environment. Requires Python 3.10+ and Git.

    .\setup.ps1 -Docker
        Sets up a production-like environment using Docker. Requires Docker, Docker Compose, Git, and OpenSSL.

    .\setup.ps1 -Docker -Gpu
        Same as -Docker, but enables GPU support for the Ollama AI service. Requires NVIDIA drivers and NVIDIA Container Toolkit.

Switches:
    -Docker         Run services in Docker instead of locally.
    -Gpu            Enable GPU support for Ollama (only valid with -Docker).
    -SkipPrereqs    Skip checking for prerequisites like Python, Docker, etc.
    -Help           Display this help message.
"
    exit 0
}

# --- 1. Prerequisite Checks ---
if (-not $SkipPrereqs) {
    Write-Info "Checking prerequisites..."
    $gitInstalled = Get-Command git -ErrorAction SilentlyContinue
    if (-not $gitInstalled) {
        Exit-Script "Git is not installed. Please install Git and ensure it's in your PATH."
    }

    if ($Docker) {
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dockerInstalled) {
            Exit-Script "Docker is not installed. Please install Docker Desktop and ensure it's running."
        }
        $opensslInstalled = Get-Command openssl -ErrorAction SilentlyContinue
        if (-not $opensslInstalled) {
            Exit-Script "OpenSSL is not installed or not in your PATH. It is required for generating SSL certificates for the Docker setup. Please install it and restart your terminal."
        }
        Write-Success "Docker, Git, and OpenSSL are found."
    }
    else {
        $pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
        if (-not $pythonInstalled) {
            Exit-Script "Python is not installed. Please install Python 3.10+ and ensure it's in your PATH."
        }
        Write-Success "Python and Git are found."
    }
} else {
    Write-Warning "Skipping prerequisite checks."
}

# --- 2. Create Directory Structure ---
Write-Info "Creating necessary directories..."
$directories = @("instance", "logs", "backups", "certs")
foreach ($dir in $directories) {
    if (-not (Test-Path -Path $dir -PathType Container)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Success "Created directory: $dir"
    }
}

# --- 3. Generate Secure Keys ---
function Generate-Secret-Key {
    param($length = 32)
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    # Use BitConverter, which is compatible with older PowerShell versions, and remove the hyphens.
    return [System.BitConverter]::ToString($bytes).Replace('-', '')
}


# --- 4. Create .env File ---
# Check if we need to create the file before calling the key generation functions
if (-not (Test-Path ".env")) {
    Write-Info "Generating .env file with new keys and default settings..."
    $flaskSecretKey = Generate-Secret-Key
    $jwtSecretKey = Generate-Secret-Key
    $dbPassword = Generate-Secret-Key -length 16

    # Define the content of the .env file using a here-string
    $envContent = @"
# Environment Configuration: 'development' or 'production'
FLASK_ENV=development

# --- Core Application Secrets ---
# WARNING: These are generated automatically. Do not commit this file.
# Regenerate these keys for a new production deployment.
SECRET_KEY=$flaskSecretKey
JWT_SECRET_KEY=$jwtSecretKey

# --- Database Configuration ---
# Make sure these match the credentials in your docker-compose.yml
DB_USER=medocpro_user
DB_PASSWORD=$dbPassword
DB_HOST=db
DB_PORT=5432
DB_NAME=medocpro_db

# --- Redis Configuration ---
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# --- Rate Limiting ---
# Format: "requests per time-unit". Examples: "100 per minute", "20/second"
DEFAULT_RATE_LIMIT=100 per minute
USER_RATE_LIMIT=50 per minute

# --- CORS Origins ---
# Comma-separated list of allowed frontend origins
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# --- AI Service (Ollama) ---
OLLAMA_HOST=http://ollama-cpu:11434
# To use a different model, change it here. Example: OLLAMA_MODEL=mistral
OLLAMA_MODEL=llama2

# --- Admin User ---
# Default admin user created on database initialization
ADMIN_EMAIL=admin@medocpro.local
ADMIN_PASSWORD=change_this_password_immediately
"@
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Success "Environment file created (.env)"
} else {
    Write-Warning ".env file already exists. Skipping creation."
}

# --- 5. Setup for LOCAL (Non-Docker) Environment ---
if (-not $Docker) {
    if (-not (Test-Path ".venv")) {
        Write-Info "Creating Python virtual environment..."
        python -m venv .venv
        Write-Success "Virtual environment created in .venv"
    }

    Write-Info "Activating virtual environment and installing dependencies..."
    & .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "Failed to install Python dependencies from requirements.txt"
    }
    Write-Success "Python dependencies installed."

    Write-Info "Initializing the database..."
    python manage.py init-database
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "Database initialization failed. Check the error message above."
    }
    Write-Success "Database initialization complete."

    Write-Success "Setup complete for local development."
    Write-Info "To run the development server, activate the venv (.\.venv\Scripts\Activate.ps1) and then run:"
    Write-Host "flask --debug run"
    exit 0
}

# --- 6. Setup for DOCKER Environment ---
if ($Docker) {
    # Generate Self-Signed SSL Certificates for Nginx
    if (-not (Test-Path "certs\key.pem")) {
        Write-Info "Generating self-signed SSL certificate for local HTTPS..."
        $certConfig = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
C = US
ST = State
L = City
O = MeDocPro
OU = Development
CN = localhost
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
"@
        $certConfig | Out-File -FilePath "certs\cert.conf" -Encoding ASCII
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout "certs\key.pem" `
            -out "certs\cert.pem" `
            -config "certs\cert.conf"
        
        if ($LASTEXITCODE -ne 0) {
            Exit-Script "Failed to generate SSL certificates."
        }
        Write-Success "Self-signed SSL certificates created in 'certs' directory."
    } else {
        Write-Warning "SSL certificates already exist. Skipping generation."
    }

    # Start Docker containers
    Write-Info "Building and starting application services with Docker Compose..."
    if ($Gpu) {
        Write-Info "Using '-Gpu' flag: Starting with 'gpu' profile for Ollama."
        docker-compose --profile gpu up --build -d
    } else {
        Write-Info "Starting with default 'cpu' profile for Ollama."
        docker-compose --profile cpu up --build -d
    }
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "Docker Compose failed to start."
    }
    Write-Success "Docker containers are up and running."
    
    # Initialize the database INSIDE the running container
    Write-Info "Waiting for database service to be ready..."
    Start-Sleep -Seconds 10
    
    Write-Info "Initializing the database inside the 'api' container..."
    docker-compose exec api python manage.py init-database
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "Database initialization failed. Check the container logs: docker-compose logs api"
    }

    Write-Success "MeDocPro setup is complete and running in Docker."
    Write-Info "Access the API at: https://localhost"
}

Write-Info "Setup finished."