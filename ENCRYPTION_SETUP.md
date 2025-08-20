# MeDocPro Dependencies Setup Guide

## Issue: Missing Required Modules

If you see errors like:
```
ModuleNotFoundError: No module named 'cryptography'
ModuleNotFoundError: No module named 'psutil'
```

This means required dependencies are not installed in your current Python environment.

## Solution Options

### Option 1: Install All Dependencies (Recommended)

**Windows (using pip):**
```bash
pip install cryptography psutil
```

**Linux/WSL (using system packages):**
```bash
sudo apt update
sudo apt install python3-cryptography python3-psutil
```

**Using pip with virtual environment:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
pip install cryptography psutil
```

### Option 2: Disable Encryption for Development (NOT for Production)

If you need to run MeDocPro quickly for development/testing without full encryption:

1. Edit `.env` file
2. Change: `HIPAA_ENCRYPTION_ENABLED=false`
3. Restart the backend

**⚠️ WARNING**: This disables PHI protection and should NEVER be used in production.

### Option 3: Use Linux Environment

The encryption system works correctly in Linux environments. If you're using WSL, run:

```bash
# From WSL terminal
python3 dev-start.py
```

## Required Dependencies

**Core Requirements:**
- ✅ `cryptography` - HIPAA encryption (REQUIRED for production)
- ✅ `psutil` - System monitoring (recommended, but optional)

**Production Requirements:**
- ✅ Both modules installed
- ✅ `HIPAA_ENCRYPTION_ENABLED=true` 
- ✅ Proper master keys configured
- ✅ HSM integration (recommended)

## Verification

To verify encryption is working:
```bash
python3 test_encryption.py
```

Should show: "🎉 All encryption tests passed!"

## Support

- For encryption issues: Check this guide first
- For key management: See `HIPAA-ENCRYPTION-IMPLEMENTATION.md`
- For compliance: Review audit logs and security documentation