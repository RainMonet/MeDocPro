# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Flask API)
```bash
# Virtual environment setup
python -m venv venv
venv\Scripts\Activate.ps1  # Windows PowerShell
source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Database management
python manage.py init-database     # Initialize database and create tables
python manage.py create-admin      # Create administrator user
python manage.py check-database    # Check database connection
python manage.py list-users        # List all users

# Start development server
python app.py

# Testing
pytest                             # Run all tests
pytest --cov=. --cov-report=html  # Run with coverage
pytest -m "unit"                   # Unit tests only
pytest -m "security"               # Security tests only
```

### Frontend (React Dashboard)
```bash
# Navigate to dashboard directory
cd medocpro-dashboard

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```bash
# Development with CPU-only AI
docker-compose --profile development --profile cpu up --build

# Production deployment
docker-compose --profile production --profile cpu up -d

# With GPU acceleration
docker-compose --profile development --profile gpu up

# Initialize database in Docker
docker-compose exec api python manage.py init-database
docker-compose exec api python manage.py create-admin
```

## Architecture Overview

### Backend Architecture
- **Flask Application Factory Pattern**: Main app created via `create_app()` in `app/__init__.py`
- **Modular Blueprint Structure**: 
  - `/health` - Health check endpoints
  - `/auth` - Authentication endpoints  
  - `/api` - Core API endpoints (templates, users)
- **Database**: PostgreSQL with SQLAlchemy ORM, SQLite fallback for development
- **Authentication**: JWT-based with role-based access control
- **AI Integration**: Ollama for text enhancement with clinical terminology
- **HIPAA Compliance**: Comprehensive audit logging with 6-year retention

### Frontend Architecture  
- **React 18** with Vite build system
- **Component Structure**:
  - `src/App.jsx` - Main application component with sidebar/header layout
  - `src/components/ui/` - Reusable UI components (StatCard)
  - `src/components/layout/` - Layout components (Header, Sidebar)
  - `src/components/modals/` - Modal components (PatientCensusModal)
- **State Management**: Local React state with hooks, theme persistence in localStorage
- **Responsive Design**: Mobile-first with sidebar collapse/overlay pattern

### Database Models
- **User**: Authentication and user management (`app/models/user.py`)
- **Template**: Clinical document templates (`app/models/template.py`) 
- **AuditLog**: HIPAA compliance audit trail (`app/models/audit_log.py`)

### Key Files
- `app.py` - Application entry point
- `config.py` - Environment configuration with security defaults
- `manage.py` - CLI tool for database operations and user management
- `requirements.txt` - Python dependencies (note: has encoding issues, may need fixing)

## Development Patterns

### Flask Route Structure
Routes are organized by blueprint:
- Health routes: Simple status endpoints
- Auth routes: JWT authentication, password requirements
- API routes: RESTful endpoints with proper error handling

### React Component Patterns
- Functional components with hooks
- Theme context for dark/light mode
- Modal system with overlay and proper accessibility
- Responsive sidebar with mobile overlay

### Security Patterns
- JWT tokens with short expiration (15 minutes)
- Password hashing with Werkzeug
- CORS configuration for frontend integration
- Input validation on all endpoints

## Common Development Tasks

### Adding New API Endpoints
1. Create route function in appropriate blueprint (`app/routes/`)
2. Add authentication decorator if needed
3. Implement proper error handling and validation
4. Add audit logging for sensitive operations

### Adding New React Components
1. Create component in appropriate subdirectory (`src/components/`)
2. Follow existing naming conventions (PascalCase for components)
3. Include proper CSS file if styling needed
4. Export from `index.js` if part of ui library

### Database Changes
1. Update model in `app/models/`
2. Create migration: `flask db migrate -m "description"`
3. Apply migration: `flask db upgrade`
4. Update `manage.py` seed data if needed

## Configuration Notes

### Environment Variables
Key variables in `.env`:
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key  
- `DATABASE_URL` - Database connection string
- `OLLAMA_URL` - AI service URL (default: http://localhost:11434)
- `CORS_ORIGINS` - Allowed frontend origins

### Default Ports
- Backend API: 5000
- Frontend dev server: 5173 (Vite default)
- PostgreSQL: 5432
- Redis: 6379
- Ollama: 11434

### Current Branch Context
Working on `features/app-jsx-refactoring` - refactoring React components into modular structure with extracted Sidebar, Header, and StatCard components.