# MeDocPro Backend API

A secure, HIPAA-compliant medical documentation API built with Flask and PostgreSQL, designed specifically for psychiatric practice management with AI-assisted text enhancement.

## 🏥 Features

### Core Functionality
- **Template Management**: Pre-built psychiatric documentation templates (Progress Notes, Assessments, Treatment Plans)
- **AI-Powered Enhancement**: Intelligent text improvement with clinical terminology via Ollama integration
- **Comprehensive Audit Logging**: Full audit trails for HIPAA compliance with 6-year retention
- **Advanced Security**: JWT authentication, role-based access control, and PHI encryption

### HIPAA Compliance
- **PHI Protection**: AES-256 encryption at rest, automatic de-identification
- **Audit Trails**: Comprehensive logging of all PHI access and system events
- **Access Controls**: Role-based permissions with fine-grained authorization
- **Data Retention**: Configurable retention policies meeting regulatory requirements

### API Features
- **RESTful Design**: Clean, documented REST endpoints with consistent response patterns
- **Rate Limiting**: Intelligent rate limiting to prevent abuse and ensure system stability
- **Real-time Monitoring**: Health checks, metrics, and performance monitoring
- **Scalable Architecture**: Containerized deployment with horizontal scaling support

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** with PowerShell 5.1+
- **Python 3.11+** 
- **Docker Desktop** (recommended) or local PostgreSQL 15+ and Redis
- **Git** for version control

### Automated Setup (Windows)

The fastest way to get started is using our PowerShell setup script:

```powershell
# Clone the repository
git clone https://github.com/your-org/medocpro-backend.git
cd medocpro-backend

# Run automated setup
.\setup.ps1

# Or for production mode
.\setup.ps1 -Mode production

# For local development without Docker
.\setup.ps1 -SkipDocker
```

The setup script will:
- ✅ Check system prerequisites
- ✅ Generate secure encryption keys
- ✅ Create environment configuration
- ✅ Set up SSL certificates
- ✅ Configure Docker environment
- ✅ Initialize Python virtual environment
- ✅ Install all dependencies
- ✅ Create management scripts

### Manual Setup

If you prefer manual setup or need to customize the installation:

1.  **Environment Configuration**
    ```powershell
    # Copy and customize environment file
    Copy-Item .env.example .env
    notepad .env  # Edit configuration values
    ```

2.  **Docker Deployment (Recommended)**
    ```powershell
    # Start development environment
    docker-compose --profile development --profile cpu up --build

    # Initialize database
    docker-compose exec api python manage.py init-database

    # Create admin user
    docker-compose exec api python manage.py create-admin
    ```

3.  **Local Development**
    ```powershell
    # Create virtual environment
    python -m venv venv
    .\venv\Scripts\Activate.ps1

    # Install dependencies
    pip install -r requirements.txt

    # Start local services (PostgreSQL, Redis)
    docker-compose up -d db redis

    # Initialize database
    python manage.py init-database

    # Start development server
    python app.py
    ```

### Verification

After setup, verify the installation:

```powershell
# Health check
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing

# API status
Invoke-WebRequest -Uri http://localhost:5000/api/auth/password-requirements -UseBasicParsing
```

Expected response: HTTP 200 with system health information.

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Security (Generate unique values for production!)
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here  
ENCRYPTION_KEY=your_encryption_key_here

# Database
DATABASE_URL=postgresql://medocpro:password@localhost:5432/medocpro_db

# AI Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# HIPAA Compliance
AUDIT_LOG_RETENTION_DAYS=2190  # 6 years
PHI_ENCRYPTION_REQUIRED=true
```

### Docker Profiles

The system supports multiple deployment profiles:

- **development**: Development with hot reload and debugging
- **production**: Production-optimized with Nginx reverse proxy
- **cpu**: CPU-only Ollama (default)
- **gpu**: GPU-accelerated Ollama
- **monitoring**: Prometheus and Grafana monitoring

```powershell
# Development with GPU acceleration
docker-compose --profile development --profile gpu up

# Production deployment
docker-compose --profile production --profile cpu up -d

# With monitoring
docker-compose --profile production --profile monitoring up -d
```

## 📋 API Documentation

### Authentication

The API uses JWT-based authentication with role-based access control:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

Response includes access token and refresh token:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "uuid", "role": "administrator" },
  "expires_in": 900
}
```

### Core Endpoints

#### Template Management
```http
GET /api/templates              # List templates
POST /api/templates             # Create template  
GET /api/templates/{id}         # Get template
PUT /api/templates/{id}         # Update template
DELETE /api/templates/{id}      # Delete template
POST /api/templates/{id}/populate  # Populate with patient data
```

#### AI Enhancement
```http
POST /api/ai/enhance           # Enhance clinical text
POST /api/ai/deidentify        # Remove PHI from text
GET /api/ai/models             # List available AI models
POST /api/ai/test-connection   # Test Ollama connection
```

#### User Management (Admin Only)
```http
GET /api/users                 # List users
POST /api/users                # Create user
PUT /api/users/{id}            # Update user
DELETE /api/users/{id}         # Delete user
PUT /api/users/{id}/activate   # Activate/deactivate
```

#### Audit & Compliance
```http
GET /api/audit/logs            # View audit logs
GET /api/audit/reports/access  # PHI access report
GET /api/audit/reports/security  # Security events
POST /api/audit/export         # Export audit data
```

### Rate Limiting

The API implements intelligent rate limiting:
- **Authentication**: 5 requests/minute
- **General API**: 10 requests/second  
- **AI Enhancement**: 30 requests/hour
- **User Management**: 10 requests/hour

### Example Usage

**Python Client:**
```python
import requests

# Authenticate
response = requests.post('http://localhost:5000/api/auth/login', json={
    'username': 'admin',
    'password': 'ChangeMe123!'
})
token = response.json()['access_token']

# Get templates
headers = {'Authorization': f'Bearer {token}'}
templates = requests.get('http://localhost:5000/api/templates', headers=headers)

# Enhance text
enhanced = requests.post('http://localhost:5000/api/ai/enhance', 
    headers=headers,
    json={
        'text': 'Patient reports feeling better today.',
        'enhancement_type': 'clinical',
        'intensity': 75
    }
)
```

**PowerShell Client:**
```powershell
# Authenticate
$loginData = @{
    username = "admin"
    password = "ChangeMe123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -Body $loginData -ContentType "application/json"

$headers = @{ Authorization = "Bearer $($response.access_token)" }

# Get templates
$templates = Invoke-RestMethod -Uri "http://localhost:5000/api/templates" `
    -Headers $headers
```

## 🛠️ Management Commands

The system includes comprehensive management commands via `manage.py`:

```powershell
# Database operations
python manage.py init-database      # Initialize database and create tables
python manage.py create-admin       # Create administrator user
python manage.py migrate           # Run database migrations
python manage.py seed-data         # Add sample templates

# Maintenance operations  
python manage.py backup-database   # Create database backup
python manage.py cleanup-logs      # Clean old audit logs (HIPAA retention)
python manage.py check-health      # System health check

# Configuration
python manage.py generate-config   # Generate sample .env file
```

### Convenience Scripts

After setup, use these PowerShell scripts for common operations:

```powershell
# Start services
.\start.ps1                    # Local development
.\start.ps1 -Docker           # Docker development
.\start.ps1 -Mode production  # Production mode

# Stop services  
.\stop.ps1

# Run tests
.\test.ps1
```

## 🔒 Security Features

### HIPAA Compliance
- **PHI Encryption**: All sensitive data encrypted with AES-256
- **Audit Logging**: Every action logged with 6-year retention
- **Access Controls**: Role-based permissions with principle of least privilege
- **De-identification**: Automatic PHI detection and removal
- **Secure Communication**: TLS 1.2+ required for all connections

### Authentication Security
- **JWT Tokens**: Short-lived access tokens (15 min) with refresh capability
- **Account Lockout**: Automatic lockout after 5 failed login attempts
- **Password Policy**: 12+ character requirement with complexity rules
- **Session Management**: Secure session handling with automatic cleanup

### API Security
- **Rate Limiting**: Aggressive rate limiting on sensitive endpoints
- **Input Validation**: Comprehensive sanitization and validation
- **SQL Injection Protection**: Parameterized queries and ORM usage
- **XSS Prevention**: Output encoding and CSP headers
- **CSRF Protection**: Token-based CSRF protection

## 📊 Monitoring & Observability

### Health Monitoring
```http
GET /health                    # Basic health check
GET /metrics                   # Prometheus metrics (if enabled)
```

### Audit Dashboard
The system provides comprehensive audit reporting:
- PHI access tracking with user attribution
- Security event monitoring and alerting
- Performance metrics and system health
- Compliance reporting for regulatory requirements

### Log Analysis
```powershell
# View recent logs
docker-compose logs -f api

# Audit log analysis
python manage.py check-health
```

## 🧪 Testing

### Running Tests
```powershell
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test categories
pytest -m "unit"           # Unit tests only
pytest -m "integration"    # Integration tests only  
pytest -m "security"       # Security tests only
pytest -m "hipaa"          # HIPAA compliance tests
```

### Test Categories
- **Unit Tests**: Fast, isolated component testing
- **Integration Tests**: Multi-component interaction testing
- **API Tests**: Endpoint functionality and response validation
- **Security Tests**: Authentication, authorization, and input validation
- **HIPAA Tests**: Compliance verification and audit trail validation

## 🚀 Production Deployment

### Docker Production Setup
```powershell
# Production deployment with all services
docker-compose --profile production --profile monitoring up -d

# Scale API instances
docker-compose up -d --scale api=3

# Update deployment
docker-compose pull && docker-compose up -d --build
```

### Security Checklist
- [ ] Generate unique SECRET_KEY, JWT_SECRET_KEY, and ENCRYPTION_KEY
- [ ] Configure proper SSL certificates (not self-signed)
- [ ] Set up database backups and retention policies
- [ ] Configure log rotation and monitoring
- [ ] Enable fail2ban or similar intrusion prevention
- [ ] Set up network firewalls and access controls
- [ ] Configure monitoring and alerting
- [ ] Review and test backup/restore procedures
- [ ] Conduct security audit and penetration testing

### Performance Tuning
- **Database**: Optimize PostgreSQL configuration for workload
- **Redis**: Configure memory limits and eviction policies  
- **Gunicorn**: Tune worker processes and timeout settings
- **Nginx**: Enable compression and proper caching headers
- **Monitoring**: Set up APM and performance monitoring

## 📚 Additional Resources

- **[Complete API Documentation](API_REFERENCE.md)**: Detailed endpoint documentation
- **[Security Guide](SECURITY.md)**: Comprehensive security documentation  
- **[HIPAA Compliance Guide](HIPAA_COMPLIANCE.md)**: Regulatory compliance information
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment best practices
- **[Developer Guide](DEVELOPER.md)**: Development setup and contribution guidelines

## 🤝 Support

### Getting Help
- **Documentation**: Check the comprehensive API documentation
- **Issues**: Report bugs and feature requests on GitHub
- **Security**: Report security vulnerabilities privately
- **Community**: Join our Discord for community support

### Default Credentials
After initial setup, the system creates a default administrator account:
- **Username**: `admin`
- **Password**: `ChangeMe123!`

**⚠️ Security Warning**: Change the default password immediately after first login!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Changelog

### Version 1.0.0 (Current)
- ✅ Complete authentication system with JWT and role-based access
- ✅ Template management with AI enhancement zones
- ✅ AI-powered text enhancement with PHI protection
- ✅ Comprehensive audit logging for HIPAA compliance
- ✅ User management and administrative controls
- ✅ Docker containerization with multi-stage builds
- ✅ Automated setup and management scripts
- ✅ Production-ready security and monitoring

### Roadmap
- 🔄 Multi-factor authentication (MFA)
- 🔄 Advanced AI models and fine-tuning
- 🔄 Real-time collaboration features  
- 🔄 Mobile API optimizations
- 🔄 Advanced analytics and reporting
- 🔄 Integration with major EHR systems

---

**Built with ❤️ for healthcare professionals who deserve better tools.**