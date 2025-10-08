# MeDocPro Windows Deployment

Complete guide for installing and deploying MeDocPro on Windows systems.

## 🚀 **Quick Start (5 Minutes)**

### **Automated Installation**
```cmd
# Download and run the installer
curl -o install-medocpro.bat https://raw.githubusercontent.com/RainMonet/MeDocPro/main/scripts/install-medocpro.bat
install-medocpro.bat
```

### **Start Application**
```cmd
cd MeDocPro
start-medocpro.bat
```

### **Access Application**
- **URL**: http://localhost:5173
- **Username**: demo@medocpro.com
- **Password**: demo123

## 📋 **What You Get**

### **Core Features**
- ✅ **Patient Census Management** - Track daily patient lists with workflow status
- ✅ **Template System** - Create and manage clinical documentation templates
- ✅ **AI Enhancement** - Improve clinical notes with AI assistance (Mistral/Llama3)
- ✅ **Document Generation** - Generate and export clinical documents in multiple formats
- ✅ **HIPAA Compliance** - Field-level encryption and comprehensive audit logging
- ✅ **User Management** - Role-based access control and authentication
- ✅ **Audit Trails** - Complete activity logging for compliance

### **Technical Stack**
- **Backend**: Python Flask with SQLAlchemy ORM
- **Frontend**: React with Vite build system
- **Database**: SQLite (default) or PostgreSQL (production)
- **AI Engine**: Ollama with Mistral and Llama3 models
- **Authentication**: JWT tokens with session management
- **Encryption**: AES-256 field-level encryption for PHI data

## 🔧 **Installation Options**

### **Option 1: Automated Installation (Recommended)**
- **Time**: 10-15 minutes
- **Skill Level**: Beginner
- **Requirements**: Administrator privileges, internet connection

```cmd
# Run the automated installer
install-medocpro.bat
```

### **Option 2: Manual Installation**
- **Time**: 30-45 minutes
- **Skill Level**: Intermediate
- **Requirements**: Basic command line knowledge

See: [WINDOWS_INSTALLATION_GUIDE.md](WINDOWS_INSTALLATION_GUIDE.md)

### **Option 3: Development Setup**
- **Time**: 45-60 minutes
- **Skill Level**: Advanced
- **Requirements**: Development experience

See: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 📊 **System Requirements**

### **Minimum Requirements**
- Windows 10/11 (64-bit)
- 8 GB RAM
- 10 GB free disk space
- Internet connection

### **Recommended Requirements**
- Windows 11 (64-bit)
- 16 GB RAM
- 25 GB free disk space (SSD preferred)
- High-speed internet

### **Software Prerequisites**
The installer will automatically install these if missing:
- Git for Windows
- Python 3.11
- Node.js 18+
- Ollama AI runtime

## 🏥 **Deployment Scenarios**

### **Scenario 1: Single User Testing**
```cmd
# Quick setup for evaluation
install-medocpro.bat
start-medocpro.bat
# Access at http://localhost:5173
```
**Use Case**: Personal evaluation, feature testing, development

### **Scenario 2: Small Team (2-5 users)**
```cmd
# Production configuration with SQLite
# Edit .env file for production settings
# Access via network IP address
```
**Use Case**: Small clinic, team collaboration

### **Scenario 3: Enterprise (5+ users)**
```cmd
# Full production deployment
# PostgreSQL database
# Windows service installation
# SSL certificates
```
**Use Case**: Hospital departments, large clinics

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed scenarios.

## 🔒 **Security Features**

### **HIPAA Compliance**
- ✅ **Field-level encryption** for all patient health information (PHI)
- ✅ **Comprehensive audit logging** with 6-year retention
- ✅ **Access controls** with role-based permissions
- ✅ **Secure authentication** with JWT tokens
- ✅ **Data integrity** with encryption key management

### **Development vs Production Security**
```
Development:
- Demo encryption keys
- Debug mode enabled
- Permissive CORS
- SQLite database

Production:
- Randomly generated keys
- Debug mode disabled
- Strict CORS policy
- PostgreSQL with SSL
```

## 🧪 **Testing and Validation**

### **System Health Check**
```cmd
# Validate system requirements
python scripts/validate-system-requirements.py

# Test all components
python scripts/troubleshoot-medocpro.py

# Test AI enhancement specifically
python test_ai_startup_reliability.py
```

### **Feature Testing Checklist**
- [ ] Login with demo credentials
- [ ] Create and edit patient census
- [ ] Create clinical templates
- [ ] Test AI text enhancement
- [ ] Generate and download documents
- [ ] View audit logs
- [ ] Test user management (if admin)

## 🐛 **Troubleshooting**

### **Common Issues and Solutions**

#### **"AI Enhancement Unavailable"**
```cmd
# Check Ollama service
ollama serve

# Test AI functionality
python test_ai_startup_reliability.py

# Reset if needed
curl http://localhost:5000/api/ai/reset-circuit-breaker
```

#### **"ModuleNotFoundError: cryptography"**
```cmd
# Run encryption fix
fix_encryption.bat

# Or manual installation
python install_encryption_deps.py
```

#### **"Cannot connect to backend"**
```cmd
# Check if backend is running
curl http://localhost:5000/health

# Start backend manually
python dev-start.py
```

#### **Frontend won't load**
```cmd
cd medocpro-dashboard
npm install
npm run dev
```

### **Diagnostic Tools**
```cmd
# Comprehensive system check
python scripts/troubleshoot-medocpro.py

# Validate configuration
python scripts/validate-config.py

# Check AI status
python check_ai_enhancement.py

# View system logs
tail -f backend.log
```

## 📚 **Documentation**

### **Quick Reference**
- **Installation**: [WINDOWS_INSTALLATION_GUIDE.md](WINDOWS_INSTALLATION_GUIDE.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Development**: [CLAUDE.md](CLAUDE.md)
- **API Reference**: Access `/health` endpoint for API status

### **Scripts and Tools**
- **Install**: `install-medocpro.bat` - Automated installation
- **Start**: `start-medocpro.bat` - Quick application startup
- **Validate**: `scripts/validate-system-requirements.py` - System check
- **Troubleshoot**: `scripts/troubleshoot-medocpro.py` - Comprehensive diagnostics
- **Test AI**: `test_ai_startup_reliability.py` - AI system validation

## 🔄 **Updates and Maintenance**

### **Updating MeDocPro**
```cmd
# Pull latest changes
git pull origin features/security-and-ai-analysis

# Update Python dependencies
pip install -r requirements.txt

# Update frontend dependencies
cd medocpro-dashboard
npm install
cd ..

# Restart application
start-medocpro.bat
```

### **Backup Important Data**
```cmd
# Backup database
copy instance\medocpro.db backup\

# Backup configuration
copy .env backup\

# Backup logs
copy backend.log backup\
```

## 📞 **Support**

### **Getting Help**
1. **Check logs**: `backend.log` for detailed error information
2. **Run diagnostics**: `python scripts/troubleshoot-medocpro.py`
3. **Check documentation**: Review relevant .md files
4. **GitHub Issues**: Report bugs or request features

### **Performance Optimization**
- **Close unnecessary applications** to free up RAM for AI models
- **Use SSD storage** for faster model loading and database operations
- **Increase virtual memory** if running multiple AI models
- **Monitor resource usage** with Task Manager

## 🎯 **Next Steps**

After successful installation:

1. **Explore Features** - Test all major functionality with demo data
2. **Configure for Your Needs** - Modify templates and settings
3. **User Training** - Familiarize your team with the interface
4. **Data Migration** - Import existing templates and data
5. **Production Planning** - Plan production deployment strategy
6. **Backup Strategy** - Set up regular database backups

## 🏆 **Success Criteria**

You have a successful deployment when:
- ✅ Application accessible at http://localhost:5173
- ✅ Can login with demo@medocpro.com / demo123
- ✅ AI enhancement shows as "Available"
- ✅ Can create and edit patient census
- ✅ Can generate documents from templates
- ✅ All diagnostic scripts pass
- ✅ No errors in backend.log

---

**Need help?** Check [WINDOWS_INSTALLATION_GUIDE.md](WINDOWS_INSTALLATION_GUIDE.md) for detailed instructions or [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment guidance.