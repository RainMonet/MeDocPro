# MeDocPro Backend

A HIPAA-compliant medical documentation API built with Flask and PostgreSQL, designed specifically for psychiatric practice management.

## 🏥 Features

### Core Functionality
- **Template Management**: Pre-built psychiatric documentation templates (Progress Notes, Assessments, Treatment Plans)
- **AI-Powered Enhancement**: Intelligent text improvement with clinical terminology
- **Patient Census Management**: Session-based patient tracking with HIPAA compliance
- **Audit Logging**: Comprehensive audit trails for compliance requirements

### Security & Compliance
- **HIPAA Compliant**: No real PHI storage, comprehensive audit logging
- **Encrypted Data**: Patient information encryption at rest
- **Rate Limiting**: API rate limiting to prevent abuse
- **SSL/TLS**: HTTPS-only communication
- **Input Sanitization**: XSS and injection protection

### API Features
- **RESTful API**: Clean, documented REST endpoints
- **Rate Limiting**: Configurable request rate limiting
- **Caching**: Redis-based response caching
- **Health Checks**: Kubernetes-ready health probes
- **Metrics**: Application and system metrics

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis (if not using Docker)

### Using Docker (Recommended)

1.  **Clone and Setup**
    ```powershell
    git clone <repository-url>
    Set-Location medocpro-backend

    # Copy environment template
    Copy-Item .env.example .env

    # Edit .env with your configuration
    notepad .env
    ```

2.  **Generate SSL Certificates**
    ```powershell
    # Note: The generate_certs.sh script is a shell script.
    # You will likely need to translate its contents to PowerShell commands
    # or run it within a Git Bash/WSL environment if OpenSSL commands are used directly.
    # A placeholder for its execution if it were a PowerShell script:
    # .\generate_certs.ps1
    # If it's a simple script using standard commands, you might be able to run it directly:
    # sh ./generate_certs.sh
    # Or, open generate_certs.sh and manually run the OpenSSL commands in PowerShell if you have OpenSSL installed.
    ```

3.  **Start Services**
    ```powershell
    # Start all services
    docker-compose up --build

    # Or use the startup script (if start.sh is a simple sequence of docker-compose commands)
    # sh ./start.sh
    ```

4.  **Initialize Database**
    ```powershell
    # In another PowerShell terminal
    # make init-db (no direct PowerShell equivalent for 'make' unless you have it installed)
    # Manually:
    docker-compose exec medocpro-api python manage.py init-database
    ```

5.  **Verify Installation**
    ```powershell
    # Health check
    Invoke-WebRequest -Uri https://localhost:5000/health -UseBasicParsing | Select-Object -ExpandProperty Content

    # API documentation
    Invoke-WebRequest -Uri https://localhost:5000/api -UseBasicParsing | Select-Object -ExpandProperty Content
    ```

### Local Development Setup

1.  **Install Dependencies**
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    ```

2.  **Setup Database**
    ```powershell
    # Start PostgreSQL and Redis
    docker-compose up -d db redis

    # Initialize database
    python manage.py init-database
    ```

3.  **Run Development Server**
    ```powershell
    $env:FLASK_ENV="development"
    $env:FLASK_DEBUG=1
    flask run --host=0.0.0.0 --port=5000
    ```

## 📋 API Documentation

### Base URL
- Production: `https://your-domain.com/api`
- Development: `https://localhost:5000/api`

### Authentication
Currently using session-based authentication. Include `X-Session-ID` header in requests:
```powershell
Invoke-WebRequest -Uri https://localhost:5000/api/templates -Headers @{"X-Session-ID"="your-session-id"} -UseBasicParsing | Select-Object -ExpandProperty Content