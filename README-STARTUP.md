# MeDocPro Startup Guide

## 🚀 Quick Start

### Development Mode (Recommended)
```bash
# Windows
dev-start.bat

# Cross-platform
python process-manager.py dev
```

### Production Mode
```bash
# Windows  
prod-start.bat

# Cross-platform
python process-manager.py prod
```

## 📁 New File Structure

### Startup Scripts
- `dev-start.py` - Development server (Flask with hot reloading)
- `prod-start.py` - Production server (Waitress WSGI)
- `dev-start.bat` - Windows development startup
- `prod-start.bat` - Windows production startup
- `process-manager.py` - Cross-platform process manager

### Environment Configuration
- `medocpro-dashboard/.env.development` - Development frontend config
- `medocpro-dashboard/.env.production` - Production frontend config

## 🔧 What Changed

### ✅ Improvements
- **2 clear startup options** instead of 5+ confusing scripts
- **Environment-based configuration** - no more hardcoded URLs
- **Proper CORS handling** - development vs production
- **Process management** - automatic port cleanup
- **Hot reloading** - works properly in development

### 🗑️ Deprecated Files (can be removed)
- `start-stable-backend.py`
- `start-super-stable-backend.py`  
- `start-working-backend.py`
- `start-simple-stable.py`
- `start-production-backend.py`
- `start-stable-windows.bat`

## 🌐 Access Points

### Development
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (Flask debug mode)
- Hot reloading: ✅ Enabled

### Production  
- Frontend: http://localhost:4173 (Vite preview) or 5173 (dev fallback)
- Backend: http://localhost:5000 (Waitress WSGI)
- Hot reloading: ❌ Disabled (restart required)

## 🔑 Login
- Username: `demo@medocpro.com`
- Password: `demo123`

## 🐛 Troubleshooting

### Port Conflicts
The process manager automatically kills conflicting processes, but if issues persist:
```bash
# Kill processes on port 5000
python process-manager.py stop
```

### Environment Issues
If frontend can't connect to backend:
1. Check `.env.development` has correct `VITE_API_BASE_URL`
2. Ensure backend is running on the configured port
3. Restart both services

### Database Issues
```bash
python manage.py check-database
python manage.py init-database  # if needed
```

## 🏗️ Architecture Benefits

1. **No more CORS confusion** - properly configured per environment
2. **No more port switching** - consistent localhost:5000
3. **No more server persistence issues** - dev mode hot reloads properly
4. **No more configuration drift** - environment variables handle all config
5. **Clear development workflow** - one command to start everything