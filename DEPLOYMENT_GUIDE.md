# MeDocPro Deployment Guide

This guide covers different deployment scenarios for MeDocPro on Windows systems.

## 📋 **Deployment Scenarios**

### **1. Development/Testing Setup**
- **Purpose**: Local testing, development, feature evaluation
- **Database**: SQLite (file-based)
- **Server**: Flask development server
- **Security**: Development keys, debug enabled
- **Resource Requirements**: Minimal (8GB RAM, 10GB disk)

### **2. Single-User Production**
- **Purpose**: Single user or small team (2-3 users)
- **Database**: SQLite or PostgreSQL
- **Server**: Waitress WSGI server
- **Security**: Production keys, debug disabled
- **Resource Requirements**: Moderate (12GB RAM, 25GB disk)

### **3. Multi-User Production**
- **Purpose**: Team deployment (5+ users)
- **Database**: PostgreSQL
- **Server**: Waitress + reverse proxy
- **Security**: Full production security
- **Resource Requirements**: High (16GB+ RAM, 50GB+ disk)

## 🔧 **Development/Testing Deployment**

### **Quick Setup**
```cmd
# 1. Run automated installer
install-medocpro.bat

# 2. Start application
start-medocpro.bat

# 3. Access at http://localhost:5173
```

### **Manual Setup**
```cmd
# 1. Install prerequisites
# Git, Python 3.11, Node.js, Ollama

# 2. Clone repository
git clone https://github.com/RainMonet/MeDocPro.git
cd MeDocPro
git checkout features/security-and-ai-analysis

# 3. Setup Python environment
python -m venv venv-windows
venv-windows\Scripts\activate
pip install -r requirements.txt

# 4. Setup frontend
cd medocpro-dashboard
npm install
cd ..

# 5. Configure environment
copy .env.template .env
# Edit .env as needed

# 6. Initialize database
python manage.py init-database
python manage.py create-admin

# 7. Start services
dev-start.bat
```

### **Development Configuration**
```env
# .env for development
FLASK_ENV=development
DEBUG=True
DATABASE_URL=  # Uses SQLite
CORS_ORIGINS=http://localhost:5173
```

## 🏢 **Single-User Production Deployment**

### **System Preparation**
```cmd
# 1. Create dedicated user account
net user medocpro /add /passwordreq:yes
net localgroup "Users" medocpro /add

# 2. Install to program files
mkdir "C:\Program Files\MeDocPro"
# Run installation as administrator
```

### **Production Configuration**
```env
# .env for production
FLASK_ENV=production
DEBUG=False
SECRET_KEY=your-random-32-character-secret-key
JWT_SECRET_KEY=your-random-jwt-secret-key
DATABASE_URL=postgresql://medocpro:password@localhost/medocpro
CORS_ORIGINS=https://yourdomain.com
HIPAA_MASTER_KEY=your-base64-encoded-32-byte-key
DATABASE_ENCRYPTION_KEY=your-base64-encoded-32-byte-key
```

### **Database Setup (PostgreSQL)**
```cmd
# Install PostgreSQL
winget install PostgreSQL.PostgreSQL

# Create database
psql -U postgres
CREATE DATABASE medocpro;
CREATE USER medocpro WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE medocpro TO medocpro;
\q

# Update .env with PostgreSQL URL
# DATABASE_URL=postgresql://medocpro:secure_password@localhost/medocpro
```

### **Windows Service Setup**
```cmd
# Install as Windows service using NSSM
# Download NSSM from https://nssm.cc/download

# Install MeDocPro as service
nssm install MeDocPro "C:\Program Files\MeDocPro\venv-windows\Scripts\python.exe"
nssm set MeDocPro Parameters "prod-start.py"
nssm set MeDocPro AppDirectory "C:\Program Files\MeDocPro"
nssm set MeDocPro DisplayName "MeDocPro Medical Documentation System"
nssm set MeDocPro Description "HIPAA-compliant medical documentation platform"
nssm set MeDocPro Start SERVICE_AUTO_START

# Start service
nssm start MeDocPro
```

## 🏥 **Multi-User Production Deployment**

### **Architecture Overview**
```
Internet → IIS/Apache → Waitress → MeDocPro
                    → PostgreSQL
                    → Redis (optional)
                    → Ollama (dedicated server)
```

### **Load Balancer Setup (IIS)**
```cmd
# Install IIS with Application Request Routing
dism /online /enable-feature /featurename:IIS-WebServerRole
dism /online /enable-feature /featurename:IIS-ApplicationRequestRouting

# Configure reverse proxy to Waitress
# In IIS Manager, create site pointing to MeDocPro
```

### **Database Clustering (PostgreSQL)**
```cmd
# Install PostgreSQL with replication
# Configure master-slave replication for high availability
# Setup automated backups
```

### **Monitoring Setup**
```cmd
# Install monitoring tools
pip install prometheus-flask-exporter
pip install grafana

# Configure system monitoring
# Setup log aggregation
# Configure alerting
```

## 🔒 **Security Hardening**

### **Encryption Keys Generation**
```python
# Generate secure keys
import secrets
import base64

# Generate 32-byte keys
secret_key = secrets.token_urlsafe(32)
jwt_key = secrets.token_urlsafe(32)
hipaa_key = base64.b64encode(secrets.token_bytes(32)).decode()
db_key = base64.b64encode(secrets.token_bytes(32)).decode()

print(f"SECRET_KEY={secret_key}")
print(f"JWT_SECRET_KEY={jwt_key}")
print(f"HIPAA_MASTER_KEY={hipaa_key}")
print(f"DATABASE_ENCRYPTION_KEY={db_key}")
```

### **Firewall Configuration**
```cmd
# Configure Windows Firewall
netsh advfirewall firewall add rule name="MeDocPro HTTP" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="MeDocPro HTTPS" dir=in action=allow protocol=TCP localport=443

# Block unnecessary ports
netsh advfirewall firewall add rule name="Block Ollama External" dir=in action=block protocol=TCP localport=11434
```

### **SSL Certificate Setup**
```cmd
# Using Let's Encrypt with Certbot
# Install Certbot for Windows
winget install Certbot.Certbot

# Generate certificate
certbot certonly --standalone -d yourdomain.com

# Configure IIS/Apache to use certificates
```

## 🔄 **Backup and Recovery**

### **Database Backup**
```cmd
# PostgreSQL backup script
pg_dump -U medocpro -h localhost medocpro > backup_$(date +%Y%m%d).sql

# Automated backup
schtasks /create /tn "MeDocPro Backup" /tr "backup-script.bat" /sc daily /st 02:00
```

### **File Backup**
```cmd
# Backup configuration and data
robocopy "C:\Program Files\MeDocPro" "D:\Backups\MeDocPro" /MIR /XD venv-windows node_modules

# Backup encryption keys
copy "C:\Program Files\MeDocPro\secure\keys\*" "D:\Backups\Keys\"
```

## 📊 **Performance Optimization**

### **System Tuning**
```cmd
# Increase virtual memory
# Configure at least 16GB virtual memory for AI models

# Optimize PostgreSQL
# Edit postgresql.conf:
# shared_buffers = 4GB
# effective_cache_size = 12GB
# max_connections = 100
```

### **Application Tuning**
```env
# Production performance settings
WORKERS=4
THREADS=2
TIMEOUT=120
MAX_CONNECTIONS=50
CONNECTION_POOL_SIZE=20
```

## 🔍 **Monitoring and Logging**

### **Application Monitoring**
```python
# health_check.py
import requests
import sys

def check_health():
    try:
        response = requests.get('http://localhost:5000/health', timeout=10)
        if response.status_code == 200:
            print("✅ Application healthy")
            return True
        else:
            print(f"❌ Application unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    if not check_health():
        sys.exit(1)
```

### **Log Monitoring**
```cmd
# Setup log rotation
# Configure Windows Event Log integration
# Setup centralized logging (optional)
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] System requirements validated
- [ ] Prerequisites installed
- [ ] Security keys generated
- [ ] Database configured
- [ ] Firewall rules configured
- [ ] SSL certificates installed (production)
- [ ] Backup strategy implemented

### **Deployment**
- [ ] Application installed
- [ ] Configuration verified
- [ ] Database initialized
- [ ] AI models downloaded
- [ ] Services configured
- [ ] Health checks passing
- [ ] Performance tests completed

### **Post-Deployment**
- [ ] User accounts created
- [ ] Training completed
- [ ] Monitoring configured
- [ ] Backup verified
- [ ] Documentation updated
- [ ] Support procedures established

## 📞 **Support and Maintenance**

### **Regular Maintenance**
```cmd
# Weekly tasks
- Check system health
- Review logs for errors
- Verify backups
- Update AI models if needed

# Monthly tasks
- Update dependencies
- Review security logs
- Performance analysis
- Backup cleanup

# Quarterly tasks
- Security assessment
- Dependency audit
- Performance optimization
- Disaster recovery testing
```

### **Troubleshooting Resources**
- **Logs**: Check `backend.log` and Windows Event Viewer
- **Health Checks**: Use `python check_ai_enhancement.py`
- **System Status**: Use `python scripts/validate-config.py`
- **Performance**: Monitor CPU, RAM, and disk usage

### **Support Contacts**
- **GitHub Issues**: https://github.com/RainMonet/MeDocPro/issues
- **Documentation**: WINDOWS_INSTALLATION_GUIDE.md
- **System Requirements**: scripts/validate-system-requirements.py

This deployment guide provides comprehensive coverage for different deployment scenarios. Choose the appropriate section based on your specific use case and requirements.