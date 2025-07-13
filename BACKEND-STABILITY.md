# Backend Stability Solutions for MeDocPro

This document outlines the different backend startup options available to ensure stable operation.

## Quick Start (Recommended)

For the most stable experience, use the enhanced startup script:

```bash
# Windows
start-stable-windows.bat

# Linux/Mac  
python3 start-stable-backend.py
```

## Available Backend Options

### 1. Stable Backend Manager (Recommended)
**File:** `start-stable-backend.py`

**Features:**
- ✅ **Auto-restart** on crashes or hangs
- ✅ **Health monitoring** every 30 seconds  
- ✅ **Exponential backoff** for restart delays
- ✅ **Comprehensive logging** to `backend-manager.log`
- ✅ **Graceful shutdown** handling
- ✅ **Maximum restart limits** to prevent infinite loops

**Usage:**
```bash
python3 start-stable-backend.py
```

**Logs:** Check `backend-manager.log` for monitoring details

### 2. Production WSGI Server  
**File:** `start-production-backend.py`

**Features:**
- ✅ **Waitress WSGI server** (production-grade)
- ✅ **Better performance** than Flask dev server
- ✅ **Connection pooling** and thread management
- ✅ **Automatic error recovery**
- ✅ **Production logging** to `production-backend.log`

**Usage:**
```bash
# Auto-installs Waitress if needed
python3 start-production-backend.py
```

### 3. Enhanced Windows Startup
**File:** `start-stable-windows.bat`

**Features:**
- ✅ **One-click startup** for both frontend and backend
- ✅ **Uses stable backend manager**
- ✅ **Automatic dependency installation**
- ✅ **Database initialization**
- ✅ **Clear status messages**

**Usage:**
```bash
# Double-click or run from command line
start-stable-windows.bat
```

### 4. Standard Development Server
**File:** `app.py` (original)

**Features:**
- ✅ **Enhanced logging** to `flask-backend.log`
- ✅ **Better error handling**
- ⚠️ **May still crash** under load (Flask dev server limitation)

**Usage:**
```bash
python3 app.py
```

## Backend Stability Improvements

### Automatic Health Monitoring
The stable backend manager monitors:
- Process health (is it running?)
- HTTP health checks (`/health` endpoint)
- Response time monitoring
- Automatic restart on failures

### Intelligent Restart Logic
- **Exponential backoff:** Increasing delays between restart attempts
- **Maximum attempts:** Prevents infinite restart loops
- **Success tracking:** Reduces restart count on successful operation
- **Graceful shutdown:** Proper cleanup before restart

### Comprehensive Logging
All backend operations are logged with timestamps:
- Startup and shutdown events
- Health check results  
- Restart attempts and reasons
- Error details and stack traces

## Troubleshooting

### Backend Keeps Crashing
1. **Check logs:** `backend-manager.log` or `flask-backend.log`
2. **Database issues:** Run `python3 manage.py check-database`
3. **Port conflicts:** Ensure port 5000 is available
4. **Dependencies:** Reinstall with `pip install -r requirements.txt`

### Frontend Can't Connect
1. **Backend running:** Check `http://localhost:5000/health`
2. **CORS issues:** Verify frontend is on port 5173
3. **Authentication:** Clear localStorage and login again

### Performance Issues
1. **Use production server:** Switch to `start-production-backend.py`
2. **Check resources:** Monitor CPU/memory usage
3. **Database optimization:** Consider connection pooling

## Log Files

| File | Purpose |
|------|---------|
| `backend-manager.log` | Stable backend manager activity |
| `production-backend.log` | Production WSGI server logs |
| `flask-backend.log` | Flask application logs |
| `backend.log` | Original backend output |

## Comparison

| Feature | Dev Server | Stable Manager | Production Server |
|---------|------------|----------------|-------------------|
| Auto-restart | ❌ | ✅ | ❌ |
| Health monitoring | ❌ | ✅ | ❌ |
| Production-grade | ❌ | ❌ | ✅ |
| Easy debugging | ✅ | ✅ | ❌ |
| High performance | ❌ | ❌ | ✅ |
| Crash recovery | ❌ | ✅ | ✅ |

## Recommendations

- **Development:** Use `start-stable-backend.py` for reliable development
- **Production:** Use `start-production-backend.py` for production deployment  
- **Windows Users:** Use `start-stable-windows.bat` for convenience
- **Testing:** Use standard `app.py` only for debugging specific issues

The stable backend manager provides the best balance of reliability and development features.