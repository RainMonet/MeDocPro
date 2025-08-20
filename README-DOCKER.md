# MeDocPro Docker Deployment Guide

This guide covers Docker-based deployment options for MeDocPro, including testing and production configurations.

## 🚀 Quick Start

### For Testing (Recommended)

**Linux/macOS:**
```bash
./test-deploy.sh
```

**Windows:**
```cmd
test-deploy.bat
```

### For Production
```bash
cp .env.production.example .env.production
# Edit .env.production with your secure settings
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Prerequisites

### Required Software
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **curl**: For health checks (usually pre-installed)

### System Requirements
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 20GB free space
- **CPU**: Multi-core processor (AI models benefit from more cores)

### Platform Support
- ✅ Windows 10/11 with Docker Desktop
- ✅ macOS 11+ (Intel and Apple Silicon)
- ✅ Ubuntu 18.04+
- ✅ Other Linux distributions with Docker support

## 🐳 Docker Configurations

### Test Environment (`docker-compose.test.yml`)
- **Purpose**: Local development and testing
- **Database**: PostgreSQL with test data
- **AI Models**: Quantized models for faster startup
- **Security**: Development keys (not for production)
- **Ports**: 3000 (frontend), 5000 (backend), 11434 (Ollama)

### Production Environment (`docker-compose.prod.yml`)
- **Purpose**: Production deployment
- **Database**: PostgreSQL with backups
- **AI Models**: Full models with better accuracy
- **Security**: Custom keys required
- **Monitoring**: Health checks and resource limits
- **Backup**: Automated database backups

## 🛠️ Deployment Commands

### Test Deployment
```bash
# Start services
./test-deploy.sh

# View logs
./test-deploy.sh logs

# Check status
./test-deploy.sh status

# Stop services
./test-deploy.sh stop

# Restart services
./test-deploy.sh restart

# Clean everything
./test-deploy.sh clean
```

### Production Deployment
```bash
# Initial setup
cp .env.production.example .env.production
# Edit .env.production with secure values

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 📊 Service Architecture

### Services Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │    │   (Flask)       │    │  (PostgreSQL)   │
│   Port: 3000    │◄──►│   Port: 5000    │◄──►│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │     Ollama      │    │    Backup       │
│   (Sessions)    │    │   (AI Models)   │    │   (Scheduled)   │
│   Port: 6379    │    │   Port: 11434   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Network Configuration
- **Test Network**: `medocpro-network` (172.20.0.0/16)
- **Production Network**: `medocpro-network` (172.21.0.0/16)
- **DNS Resolution**: Services communicate by container name

## 🤖 AI Model Management

### Automatic Model Download
Models are automatically downloaded on first startup:
- **Mistral 7B**: `mistral:7b-instruct-q4_0` (4.1GB)
- **Llama 2 7B**: `llama2:7b-chat-q4_0` (3.8GB)
- **CodeLlama** (Production only): `codellama:7b-instruct` (3.8GB)

### Manual Model Management
```bash
# List available models
docker-compose exec ollama ollama list

# Download additional models
docker-compose exec ollama ollama pull llama2:13b-chat

# Remove unused models
docker-compose exec ollama ollama rm model_name
```

### Model Storage
- **Location**: Docker volume `ollama_models`
- **Persistence**: Models persist between container restarts
- **Backup**: Include in your backup strategy for production

## 🔧 Configuration

### Environment Variables

#### Test Environment (`.env.test`)
Pre-configured for immediate testing with development defaults.

#### Production Environment (`.env.production`)
**Required customizations:**
```bash
SECRET_KEY=your-super-secure-secret-key-here-change-me
JWT_SECRET_KEY=your-jwt-secret-key-here-change-me
POSTGRES_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password
CORS_ORIGINS=https://your-domain.com
```

### Database Configuration
- **Test**: Automatic initialization with sample data
- **Production**: Manual initialization required
```bash
# Initialize production database
docker-compose -f docker-compose.prod.yml exec medocpro-app python manage.py init-database
docker-compose -f docker-compose.prod.yml exec medocpro-app python manage.py create-admin
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Application**: `http://localhost:5000/health`
- **Frontend**: `http://localhost:3000`
- **Database**: Automatic via Docker health checks
- **Ollama**: `http://localhost:11434/api/tags`

### Log Locations
```bash
# Application logs
docker-compose logs medocpro-app

# Database logs
docker-compose logs postgres

# AI service logs
docker-compose logs ollama

# All services
docker-compose logs -f
```

## 💾 Data Management

### Persistent Data
- **Database**: `postgres_data` volume
- **AI Models**: `ollama_models` volume
- **Application Data**: `./data` directory
- **Logs**: `./logs` directory

### Backup Strategy (Production)
```bash
# Manual database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U medocpro medocpro > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U medocpro medocpro < backup.sql
```

Automated backups run daily via the backup service in production mode.

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check system resources
docker system df
docker system prune  # Clean up space if needed

# Check port conflicts
netstat -tulpn | grep -E ':(3000|5000|5432|6379|11434)'
```

#### Ollama Models Not Downloading
```bash
# Check Ollama logs
docker-compose logs ollama

# Manually trigger download
docker-compose exec ollama ollama pull mistral:7b-instruct-q4_0
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U medocpro

# Reset database (⚠️ DESTROYS DATA)
docker-compose down -v
docker-compose up -d
```

#### Frontend Build Errors
```bash
# Clear Docker build cache
docker system prune -a

# Rebuild with no cache
docker-compose build --no-cache
```

### Performance Optimization

#### For Low-Memory Systems
```yaml
# Add to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

#### For Better AI Performance
- Use `DOCKER_PLATFORM=linux/arm64` on Apple Silicon Macs
- Allocate more CPU cores to Ollama service
- Consider using larger models for better accuracy

## 🔒 Security Considerations

### Development (Test Mode)
- Uses development keys (not secure)
- Database passwords are visible
- Debug mode enabled
- CORS allows localhost origins

### Production Mode
- **Required**: Change all default passwords
- **Required**: Use HTTPS with reverse proxy
- **Required**: Secure environment variables
- **Required**: Regular security updates

### Network Security
```bash
# Production reverse proxy example (nginx)
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Database: Consider PostgreSQL clustering
- Backend: Scale with Docker Swarm or Kubernetes
- Frontend: Use CDN for static assets
- AI: Multiple Ollama instances with load balancing

### Vertical Scaling
- Increase container resource limits
- Use faster storage (SSD)
- Allocate more RAM to PostgreSQL
- Use larger AI models for better accuracy

## 📞 Support

### Getting Help
1. Check logs: `docker-compose logs service_name`
2. Verify health checks: `./test-deploy.sh status`
3. Review configuration: Environment variables and Docker Compose files
4. Check system resources: `docker system df`

### Reporting Issues
Include in bug reports:
- Operating system and Docker version
- Complete error logs
- Docker Compose file used
- Environment variable configuration (without sensitive data)

---

**Happy Deploying! 🚀**