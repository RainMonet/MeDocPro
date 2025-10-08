# MeDocPro Windows Installation Guide

This guide will help you install and set up MeDocPro on a Windows PC for testing and development.

## 📋 **System Requirements**

### **Minimum Requirements**
- Windows 10/11 (64-bit)
- 8 GB RAM (16 GB recommended)
- 10 GB free disk space (20 GB recommended for AI models)
- Internet connection for downloads

### **Software Prerequisites**
- Git for Windows
- Python 3.9+ (Python 3.11 recommended)
- Node.js 18+ and npm
- Ollama (for AI features)

## 🚀 **Quick Installation (Automated)**

1. **Download and run the automated installer:**
   ```cmd
   curl -o install-medocpro.bat https://raw.githubusercontent.com/RainMonet/MeDocPro/main/scripts/install-medocpro.bat
   install-medocpro.bat
   ```

2. **Follow the prompts** - the script will install all dependencies and set up the environment

3. **Start the application:**
   ```cmd
   cd MeDocPro
   start-medocpro.bat
   ```

## 🔧 **Manual Installation**

### **Step 1: Install Prerequisites**

#### **1.1 Install Git for Windows**
```cmd
# Download from https://git-scm.com/download/win
# Or use winget:
winget install Git.Git
```

#### **1.2 Install Python 3.11**
```cmd
# Download from https://www.python.org/downloads/
# Or use winget:
winget install Python.Python.3.11
```

#### **1.3 Install Node.js**
```cmd
# Download from https://nodejs.org/
# Or use winget:
winget install OpenJS.NodeJS
```

#### **1.4 Install Ollama**
```cmd
# Download from https://ollama.ai/download
# Or use winget:
winget install Ollama.Ollama
```

### **Step 2: Clone and Setup Project**

#### **2.1 Clone Repository**
```cmd
git clone https://github.com/RainMonet/MeDocPro.git
cd MeDocPro
```

#### **2.2 Checkout Feature Branch (for latest features)**
```cmd
git checkout features/security-and-ai-analysis
```

#### **2.3 Create Python Virtual Environment**
```cmd
python -m venv venv-windows
venv-windows\Scripts\activate
```

#### **2.4 Install Python Dependencies**
```cmd
# Run the dependency installer (handles cryptography issues)
python install_encryption_deps.py

# Install remaining requirements
pip install -r requirements.txt
```

#### **2.5 Install Frontend Dependencies**
```cmd
cd medocpro-dashboard
npm install
cd ..
```

### **Step 3: Configure Environment**

#### **3.1 Copy Environment Template**
```cmd
copy .env.template .env
```

#### **3.2 Configure Database**
```cmd
python manage.py init-database
python manage.py create-admin
```

#### **3.3 Set Up AI Models**
```cmd
# Download AI models (this may take 5-10 minutes)
ollama pull mistral:latest
ollama pull llama3:latest
```

### **Step 4: Start Application**

#### **4.1 Development Mode (Recommended for Testing)**
```cmd
# Single command startup
dev-start.bat

# Or manual startup:
python dev-start.py
# In another terminal:
cd medocpro-dashboard && npm run dev
```

#### **4.2 Production Mode**
```cmd
prod-start.bat
```

### **Step 5: Access Application**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

**Demo Credentials:**
- Username: `demo@medocpro.com`
- Password: `demo123`

## 🔍 **Verification and Testing**

### **Test System Health**
```cmd
# Run comprehensive system tests
python scripts/run-tests.py

# Test AI enhancement specifically
python test_ai_startup_reliability.py

# Check configuration
python scripts/validate-config.py
```

### **Test Core Features**
1. **Login** with demo credentials
2. **Patient Census** - Add/edit patients
3. **Templates** - Create and edit templates
4. **AI Enhancement** - Test text improvement
5. **Document Generation** - Generate and download documents
6. **Audit Logs** - View system audit trail

## 🐛 **Troubleshooting**

### **Common Issues**

#### **"ModuleNotFoundError: No module named 'cryptography'"**
```cmd
# Run the automatic fix
fix_encryption.bat

# Or manual fix:
python install_encryption_deps.py
```

#### **"Ollama not found" or AI Enhancement Unavailable**
```cmd
# Check Ollama installation
ollama --version

# Start Ollama service
ollama serve

# Test Ollama connection
curl http://localhost:11434/api/tags
```

#### **Port Conflicts**
```cmd
# Stop all MeDocPro processes
python process-manager.py stop

# Kill processes on specific ports
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### **Frontend Won't Start**
```cmd
cd medocpro-dashboard
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### **Database Issues**
```cmd
# Reset database
python manage.py init-database

# Check database connection
python manage.py check-database
```

### **Log Analysis**
```cmd
# View backend logs
tail -f backend.log

# View startup logs
python check_ai_enhancement.py

# Debug AI enhancement
curl http://localhost:5000/api/ai/debug-status
```

## 📊 **Performance Optimization**

### **For Development**
- Use SQLite database (default)
- Enable debug mode
- Use development server

### **For Production Testing**
- Install PostgreSQL for better performance
- Use production server (Waitress)
- Disable debug mode

### **AI Performance**
- Ensure sufficient RAM (8GB+ available)
- Use SSD storage for faster model loading
- Close unnecessary applications

## 🔒 **Security Notes**

### **Development Environment**
- Uses demo encryption keys (NOT for production)
- Debug mode enabled (exposes detailed errors)
- CORS allows all origins

### **For Production**
- Change all secret keys in `.env`
- Disable debug mode
- Configure proper CORS origins
- Set up proper database encryption
- Use HTTPS/SSL certificates

## 📞 **Getting Help**

### **Log Locations**
- Backend: `backend.log`
- Frontend: Browser console (F12)
- Ollama: Check Windows Event Viewer

### **Diagnostic Commands**
```cmd
# System health check
python check_ai_enhancement.py

# Comprehensive tests
python test_ai_startup_reliability.py

# Configuration validation
python scripts/validate-config.py

# Database status
python manage.py check-database
```

### **Support Resources**
- GitHub Issues: https://github.com/RainMonet/MeDocPro/issues
- Documentation: Check README.md and CLAUDE.md
- Logs: Always check backend.log for detailed error information

## 🎯 **Next Steps**

After successful installation:

1. **Explore Features** - Try all major functionality
2. **Custom Configuration** - Modify settings for your needs
3. **Data Import** - Import your own templates and data
4. **User Training** - Familiarize team with interface
5. **Backup Strategy** - Set up database backups
6. **Production Planning** - Plan production deployment

## 📋 **Installation Checklist**

- [ ] Prerequisites installed (Git, Python, Node.js, Ollama)
- [ ] Repository cloned and branch checked out
- [ ] Python virtual environment created and activated
- [ ] Python dependencies installed (including cryptography)
- [ ] Frontend dependencies installed
- [ ] Environment configured (.env file)
- [ ] Database initialized with admin user
- [ ] AI models downloaded (mistral, llama3)
- [ ] Application starts successfully
- [ ] Can login with demo credentials
- [ ] AI enhancement working
- [ ] All core features tested

Congratulations! MeDocPro should now be running successfully on your Windows system.