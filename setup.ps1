# MeDocPro Backend Setup Script
# HIPAA-compliant medical documentation system setup for Windows

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production")]
    [string]$Mode = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$Docker = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDependencies = $false
)

# Script configuration
$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Cyan"

function Write-Step {
    param([string]$Message)
    Write-Host "🔧 $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Error "PowerShell 5.1 or later required. Current version: $($PSVersionTable.PSVersion)"
        exit 1
    }
    Write-Success "PowerShell version: $($PSVersionTable.PSVersion)"
    
    # Check Python
    try {
        $pythonVersion = python --version 2>&1
        if ($pythonVersion -match "Python (\d+)\.(\d+)") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -eq 3 -and $minor -ge 11) {
                Write-Success "Python version: $pythonVersion"
            } else {
                Write-Error "Python 3.11+ required. Found: $pythonVersion"
                exit 1
            }
        }
    } catch {
        Write-Error "Python not found. Please install Python 3.11+"
        exit 1
    }
    
    # Check pip
    try {
        pip --version | Out-Null
        Write-Success "pip is available"
    } catch {
        Write-Error "pip not found. Please ensure pip is installed"
        exit 1
    }
    
    # Check Docker if requested
    if ($Docker) {
        try {
            docker --version | Out-Null
            docker-compose --version | Out-Null
            Write-Success "Docker and Docker Compose are available"
        } catch {
            Write-Error "Docker or Docker Compose not found. Please install Docker Desktop"
            exit 1
        }
    }
}

function New-ProjectDirectories {
    Write-Step "Creating project directory structure..."
    
    $directories = @(
        "api",
        "models",
        "utils",
        "tests",
        "logs",
        "security\keys",
        "security\certs",
        "backups",
        "config",
        "scripts",
        "nginx"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created directory: $dir"
        } else {
            Write-Information "Directory exists: $dir"
        }
    }
}

function Install-PythonDependencies {
    Write-Step "Installing Python dependencies..."
    
    # Check if virtual environment exists
    if (-not (Test-Path ".venv")) {
        Write-Step "Creating virtual environment..."
        python -m venv .venv
        Write-Success "Virtual environment created"
    }
    
    # Activate virtual environment
    Write-Step "Activating virtual environment..."
    & ".\.venv\Scripts\Activate.ps1"
    
    # Upgrade pip
    Write-Step "Upgrading pip..."
    python -m pip install --upgrade pip
    
    # Install dependencies
    if (Test-Path "requirements.txt") {
        Write-Step "Installing from requirements.txt..."
        pip install -r requirements.txt
        Write-Success "Dependencies installed from requirements.txt"
    } else {
        Write-Step "Installing core dependencies..."
        $dependencies = @(
            "Flask==3.0.0",
            "Flask-SQLAlchemy==3.1.1",
            "Flask-Migrate==4.0.5",
            "Flask-JWT-Extended==4.6.0",
            "Flask-Limiter==3.5.0",
            "Flask-CORS==4.0.0",
            "psycopg2-binary==2.9.9",
            "redis==5.0.1",
            "bcrypt==4.1.2",
            "cryptography==41.0.8",
            "python-dotenv==1.0.0",
            "requests==2.31.0",
            "pytest==7.4.3",
            "pytest-flask==1.3.0",
            "gunicorn==21.2.0"
        )
        
        foreach ($dep in $dependencies) {
            pip install $dep
        }
        Write-Success "Core dependencies installed"
    }
}

function New-EnvironmentFile {
    Write-Step "Creating environment configuration..."
    
    if (-not (Test-Path ".env")) {
        # Generate secure random values
        $secretKey = [System.Guid]::NewGuid().ToString()
        $jwtSecret = [System.Guid]::NewGuid().ToString()
        $encryptionKey = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
        
        $envContent = @"
# MeDocPro Environment Configuration
# SECURITY: Never commit this file to version control

# Application Settings
FLASK_APP=app.py
FLASK_ENV=$Mode
SECRET_KEY=$secretKey
DEBUG=$($Mode -eq "development")

# Database Configuration
DATABASE_URL=postgresql://medocpro:secure_password@localhost:5432/medocpro_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET_KEY=$jwtSecret
JWT_ACCESS_TOKEN_EXPIRES=900
JWT_REFRESH_TOKEN_EXPIRES=604800

# Encryption
ENCRYPTION_KEY=$encryptionKey

# Rate Limiting
RATELIMIT_STORAGE_URL=redis://localhost:6379/1

# Ollama AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TIMEOUT=30

# Security Headers
SECURE_SSL_REDIRECT=$($Mode -eq "production")
SESSION_COOKIE_SECURE=$($Mode -eq "production")
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax

# CORS Settings
CORS_ORIGINS=http://localhost:3000;http://localhost:5000

# Logging
LOG_LEVEL=INFO
LOG_TO_FILE=True
LOG_ROTATION=True

# Backup Configuration
BACKUP_RETENTION_DAYS=90
AUTO_BACKUP_ENABLED=True
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success "Environment file created (.env)"
        Write-Warning "Please review and update the .env file with your specific configuration"
    } else {
        Write-Information "Environment file already exists (.env)"
    }
}

function New-SecurityKeys {
    Write-Step "Generating security keys and certificates..."
    
    # Generate JWT keys
    $jwtDir = "security\keys"
    if (-not (Test-Path "$jwtDir\jwt_private.key")) {
        # Generate a simple key file for JWT (in production, use proper key generation)
        $jwtKey = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64)
        $jwtKeyBase64 = [System.Convert]::ToBase64String($jwtKey)
        $jwtKeyBase64 | Out-File -FilePath "$jwtDir\jwt_private.key" -Encoding UTF8
        Write-Success "JWT private key generated"
    }
    
    # Generate SSL certificates for development
    $certDir = "security\certs"
    if (-not (Test-Path "$certDir\server.crt")) {
        Write-Step "Generating self-signed SSL certificate for development..."
        
        # Create a simple batch file to generate certificates (requires OpenSSL)
        $certScript = '@echo off
echo Generating self-signed certificate for development...
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=MeDocPro/CN=localhost"'
        
        $certScript | Out-File -FilePath "$certDir\generate_cert.bat" -Encoding ASCII
        
        Write-Warning "SSL certificate generation requires OpenSSL. Run security\certs\generate_cert.bat if OpenSSL is available."
        Write-Information "For development, you can skip SSL or use Flask's built-in development server."
    }
}

function Initialize-Database {
    if (-not $Docker) {
        Write-Step "Database initialization (local PostgreSQL required)..."
        Write-Warning "Please ensure PostgreSQL is running and accessible"
        Write-Information "You can run 'python manage.py init-database' after setup to initialize the database"
    }
}

function New-DockerConfiguration {
    if ($Docker) {
        Write-Step "Setting up Docker configuration..."
        
        # Create docker-compose.yml if it doesn't exist
        if (-not (Test-Path "docker-compose.yml")) {
            $dockerCompose = @"
version: '3.8'

services:
  medocpro-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=$Mode
      - DATABASE_URL=postgresql://medocpro:secure_password@db:5432/medocpro_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
      - ./backups:/app/backups
    networks:
      - medocpro-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: medocpro_db
      POSTGRES_USER: medocpro
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - medocpro-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - medocpro-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./security/certs:/etc/nginx/certs:ro
    depends_on:
      - medocpro-api
    networks:
      - medocpro-network

volumes:
  postgres_data:
  redis_data:

networks:
  medocpro-network:
    driver: bridge
"@
            $dockerCompose | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
            Write-Success "Docker Compose configuration created"
        }
    }
}

function Test-Setup {
    Write-Step "Testing setup..."
    
    # Test Python imports
    try {
        python -c "import flask, sqlalchemy, bcrypt, cryptography; print('All required packages imported successfully')"
        Write-Success "Python package imports successful"
    } catch {
        Write-Error "Python package import failed. Please check installation"
        return $false
    }
    
    # Test environment file
    if (Test-Path ".env") {
        Write-Success "Environment file exists"
    } else {
        Write-Error "Environment file missing"
        return $false
    }
    
    return $true
}

function Show-CompletionMessage {
    Write-Host ""
    Write-Host "🎉 MeDocPro Backend Setup Complete!" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor $Blue
    Write-Host ""
    
    if ($Docker) {
        Write-Host "   1. Start services with Docker:" -ForegroundColor $Yellow
        Write-Host "      docker-compose up --build" -ForegroundColor White
        Write-Host ""
        Write-Host "   2. Initialize database:" -ForegroundColor $Yellow
        Write-Host "      docker-compose exec medocpro-api python manage.py init-database" -ForegroundColor White
    } else {
        Write-Host "   1. Activate virtual environment:" -ForegroundColor $Yellow
        Write-Host "      .\.venv\Scripts\Activate.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "   2. Start PostgreSQL and Redis services" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "   3. Initialize database:" -ForegroundColor $Yellow
        Write-Host "      python manage.py init-database" -ForegroundColor White
        Write-Host ""
        Write-Host "   4. Start development server:" -ForegroundColor $Yellow
        Write-Host "      python app.py" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "   5. Create admin user:" -ForegroundColor $Yellow
    Write-Host "      python manage.py create-admin" -ForegroundColor White
    Write-Host ""
    Write-Host "   6. Test API health:" -ForegroundColor $Yellow
    Write-Host "      Invoke-WebRequest -Uri http://localhost:5000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 Security Notes:" -ForegroundColor $Red
    Write-Host "   - Review and update .env file with secure values" -ForegroundColor White
    Write-Host "   - Change default passwords before production use" -ForegroundColor White
    Write-Host "   - Generate proper SSL certificates for production" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor $Blue
    Write-Host "   - API Reference: README.md" -ForegroundColor White
    Write-Host "   - Security Guide: SECURITY.md" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Write-Host "🏥 MeDocPro Backend Setup" -ForegroundColor $Blue
    Write-Host "HIPAA-compliant medical documentation system" -ForegroundColor $Blue
    Write-Host ""
    
    if (-not $SkipDependencies) {
        Test-Prerequisites
    }
    
    New-ProjectDirectories
    Install-PythonDependencies
    New-EnvironmentFile
    New-SecurityKeys
    
    if ($Docker) {
        New-DockerConfiguration
    } else {
        Initialize-Database
    }
    
    if (Test-Setup) {
        Show-CompletionMessage
    } else {
        Write-Error "Setup completed with errors. Please review the output above."
        exit 1
    }
    
} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    Write-Host "Error Details:" -ForegroundColor $Red
    Write-Host $_.Exception -ForegroundColor $Red
    exit 1
}