#!/bin/bash

# =============================================================================
# MeDocPro Service Startup Script
# Initializes and starts all services within the Docker container
# =============================================================================

set -e

echo "🚀 Starting MeDocPro services..."

# Create necessary directories
mkdir -p /app/logs /app/data /var/log/supervisor /var/log/nginx

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until python -c "
import psycopg2
import os
import sys
try:
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    conn.close()
    print('✅ Database connected')
except:
    print('❌ Database not ready')
    sys.exit(1)
" 2>/dev/null; do
    echo "Waiting for database..."
    sleep 2
done

# Initialize database if needed
echo "🗄️ Initializing database..."
python manage.py init-database 2>/dev/null || echo "Database already initialized"

# Create admin user if it doesn't exist
echo "👤 Ensuring admin user exists..."
python -c "
from app import create_app
from app.models.user import User
from app import db

app = create_app()
with app.app_context():
    admin = User.query.filter_by(email='admin@medocpro.com').first()
    if not admin:
        admin = User(
            email='admin@medocpro.com',
            username='admin',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('✅ Admin user created')
    else:
        print('✅ Admin user exists')
" 2>/dev/null || echo "Could not create admin user, will try later"

# Set proper permissions
chown -R app:app /app/logs /app/data

# Test Ollama connection
echo "🤖 Testing Ollama connection..."
python -c "
import requests
import os
try:
    response = requests.get(f\"{os.environ.get('OLLAMA_URL', 'http://ollama:11434')}/api/tags\", timeout=5)
    if response.status_code == 200:
        print('✅ Ollama connected')
    else:
        print('⚠️ Ollama not ready yet')
except:
    print('⚠️ Ollama connection failed, will retry later')
" 2>/dev/null || echo "Ollama check failed"

echo "🎯 Starting supervisor to manage services..."

# Start supervisor to manage all services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf