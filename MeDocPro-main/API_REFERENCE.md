# MeDocPro Backend API Reference

**Version:** 1.0.0  
**Base URL:** `https://localhost:5000/api`  
**Protocol:** HTTPS  
**Authentication:** JWT Bearer Token  

## Overview

The MeDocPro backend provides a secure, HIPAA-compliant API for psychiatric documentation management with AI-assisted text enhancement. All endpoints require HTTPS and implement comprehensive audit logging.

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

**Token Lifecycle:**
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are automatically invalidated on logout

### Rate Limiting

API endpoints implement rate limiting to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 10 requests per second
- AI enhancement endpoints: 30 requests per hour

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "username": "user@example.com",
    "email": "user@example.com",
    "role": "clinician",
    "first_name": "John",
    "last_name": "Doe"
  },
  "expires_in": 900
}
```

**Rate Limit:** 5 requests per minute  
**Security:** Failed login attempts trigger account lockout after 5 attempts

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 900
}
```

### POST /api/auth/logout

Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /api/auth/change-password

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123!",
  "confirm_password": "newpassword123!"
}
```

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## Template Management

### GET /api/templates

List clinical documentation templates with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `category`: Filter by template category (progress, assessment, treatment, etc.)
- `search`: Search in template name and description
- `is_public`: Filter by public/private templates (true/false)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `sort_by`: Sort field (name, created_at, updated_at, usage_count)
- `sort_order`: Sort order (asc, desc)

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Psychiatric Progress Note",
      "category": "progress",
      "version": "1.0",
      "description": "Standard psychiatric progress note template",
      "is_public": true,
      "usage_count": 45,
      "created_at": "2025-06-09T10:00:00Z",
      "updated_at": "2025-06-09T10:00:00Z",
      "created_by_name": "Dr. Smith"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "categories": {
    "progress": {
      "name": "Progress Notes",
      "description": "Documentation of patient progress during treatment",
      "color": "#10b981",
      "icon": "file-text"
    }
  }
}
```

### POST /api/templates

Create a new clinical documentation template.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Custom Progress Note",
  "category": "progress",
  "description": "Custom template for progress notes",
  "content": "PROGRESS NOTE\n\nDate: {{date_of_service}}\nPatient: {{patient_name}}\n\nCHIEF COMPLAINT:\n{{chief_complaint}}\n\nASSESSMENT:\n{{assessment}}\n\nPLAN:\n{{plan}}",
  "placeholders": [
    {
      "key": "date_of_service",
      "description": "Date of service",
      "example": "June 9, 2025",
      "type": "date"
    },
    {
      "key": "patient_name",
      "description": "Patient name",
      "example": "Smith, John",
      "type": "phi"
    }
  ],
  "ai_enhancement_zones": [
    {
      "start": 100,
      "end": 200,
      "type": "clinical",
      "intensity": 75,
      "style": "professional"
    }
  ],
  "is_public": false
}
```

**Response:**
```json
{
  "message": "Template created successfully",
  "template": {
    "id": "uuid",
    "name": "Custom Progress Note",
    "category": "progress",
    "content": "PROGRESS NOTE...",
    "placeholders": [...],
    "ai_enhancement_zones": [...],
    "created_at": "2025-06-09T10:00:00Z"
  }
}
```

**Rate Limit:** 10 requests per hour

### GET /api/templates/{id}

Get a specific template by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "name": "Psychiatric Progress Note",
    "category": "progress",
    "version": "1.0",
    "content": "PROGRESS NOTE\n\nDate: {{date_of_service}}...",
    "placeholders": [
      {
        "key": "date_of_service",
        "description": "Date of service",
        "example": "June 9, 2025",
        "type": "date"
      }
    ],
    "ai_enhancement_zones": [],
    "description": "Standard psychiatric progress note template",
    "is_public": true,
    "is_active": true,
    "usage_count": 45,
    "created_at": "2025-06-09T10:00:00Z",
    "updated_at": "2025-06-09T10:00:00Z",
    "created_by_name": "Dr. Smith"
  }
}
```

### PUT /api/templates/{id}

Update an existing template.

**Headers:** `Authorization: Bearer <token>`

**Request:** Same format as POST /api/templates

**Permissions:** Only template creator or administrators can update

### DELETE /api/templates/{id}

Soft delete a template.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Template deleted successfully"
}
```

**Note:** Templates with existing instances cannot be deleted

### POST /api/templates/{id}/populate

Populate a template with patient data and optionally enhance with AI.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "patient_identifier": "PATIENT_12345",
  "placeholder_values": {
    "patient_name": "Smith, John",
    "date_of_service": "June 9, 2025",
    "chief_complaint": "Follow-up for depression treatment",
    "assessment": "Patient shows improvement in mood and energy levels",
    "plan": "Continue current medication regimen, schedule follow-up in 4 weeks"
  },
  "ai_enhance": true,
  "encounter_date": "2025-06-09T10:30:00Z"
}
```

**Response:**
```json
{
  "message": "Template populated successfully",
  "instance_id": "uuid",
  "populated_content": "PROGRESS NOTE\n\nDate: June 9, 2025\nPatient: Smith, John\n\nCHIEF COMPLAINT:\nFollow-up for depression treatment\n\nASSESSMENT:\nPatient shows improvement in mood and energy levels\n\nPLAN:\nContinue current medication regimen, schedule follow-up in 4 weeks",
  "status": "draft",
  "ai_enhancement_available": true,
  "ai_zones_count": 2
}
```

**Rate Limit:** 30 requests per hour  
**Audit:** All template population is logged as PHI access

## AI Enhancement

### POST /api/ai/enhance

Enhance clinical text using AI with PHI protection.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "text": "Patient reports feeling better. Mood improved. Continue meds.",
  "enhancement_type": "clinical",
  "intensity": 75,
  "style": "professional",
  "model": "llama2",
  "deidentify_first": true,
  "preserve_structure": true
}
```

**Enhancement Types:**
- `clinical`: Professional medical terminology and clinical language
- `narrative`: Improved narrative flow and readability
- `diagnostic`: Focus on diagnostic criteria and clinical reasoning

**Styles:**
- `professional`: Formal medical language
- `concise`: Brief and direct
- `detailed`: Comprehensive documentation
- `empathetic`: Patient-centered language
- `objective`: Fact-based observations

**Response:**
```json
{
  "enhanced_text": "The patient reports subjective improvement in overall mood and affect. Current therapeutic regimen appears to be demonstrating clinical efficacy. Recommend continuation of present pharmacological intervention.",
  "original_length": 67,
  "enhanced_length": 156,
  "processing_time_ms": 1250,
  "model_used": "llama2",
  "enhancement_applied": {
    "type": "clinical",
    "intensity": 75,
    "style": "professional"
  },
  "phi_analysis": {
    "input_phi_detected": false,
    "input_phi_count": 0,
    "output_phi_detected": false,
    "output_phi_count": 0,
    "deidentification_applied": false
  },
  "interaction_id": "uuid"
}
```

**Rate Limit:** 30 requests per hour  
**Security:** All AI interactions are logged and monitored for PHI exposure

### POST /api/ai/deidentify

De-identify PHI in clinical text.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "text": "Patient John Smith (DOB: 01/15/1985, SSN: 123-45-6789) was seen today at 123 Main St, Anytown, CA 90210. His email is jsmith@email.com and phone is (555) 123-4567.",
  "method": "placeholder",
  "return_mapping": false
}
```

**De-identification Methods:**
- `placeholder`: Replace with descriptive placeholders (e.g., [PATIENT_NAME_1])
- `mask`: Mask characters while preserving structure (e.g., XXX-XX-XXXX)
- `redact`: Replace with [REDACTED]

**Response:**
```json
{
  "deidentified_text": "Patient [PATIENT_NAME_1] (DOB: [DATE_1], SSN: [ID_1]) was seen today at [ADDRESS_1]. His email is [CONTACT_1] and phone is [CONTACT_2].",
  "phi_detected": 6,
  "replacements_made": 6,
  "method_used": "placeholder",
  "categories_found": ["names", "dates", "identifiers", "contact", "addresses"]
}
```

**Rate Limit:** 50 requests per hour

### GET /api/ai/models

List available AI models from Ollama.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "size": 3825819519,
      "modified_at": "2025-06-09T10:00:00Z",
      "details": {
        "format": "gguf",
        "family": "llama",
        "families": ["llama"],
        "parameter_size": "7B",
        "quantization_level": "Q4_0"
      }
    }
  ],
  "total_models": 1,
  "ollama_url": "http://localhost:11434"
}
```

### POST /api/ai/test-connection

Test connection to Ollama AI service.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "url": "http://localhost:11434",
  "model": "llama2"
}
```

**Response:**
```json
{
  "connected": true,
  "url": "http://localhost:11434",
  "model": "llama2",
  "model_available": true,
  "available_models": ["llama2:latest", "mistral:latest"],
  "connectivity_time_ms": 125,
  "generation_test": {
    "success": true,
    "response_time_ms": 850,
    "response_preview": "Connection successful."
  },
  "timestamp": "2025-06-09T10:00:00Z"
}
```

**Rate Limit:** 10 requests per hour

## User Management (Administrator Only)

### GET /api/users

List users with filtering and pagination.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** Administrator

**Query Parameters:**
- `role`: Filter by user role (administrator, clinician, read_only)
- `is_active`: Filter by active status (true/false)
- `search`: Search in username, email, first/last name
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "jdoe",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "clinician",
      "title": "Dr.",
      "department": "Psychiatry",
      "is_active": true,
      "created_at": "2025-06-09T10:00:00Z",
      "last_login": "2025-06-09T09:00:00Z",
      "password_age_days": 30,
      "is_locked": false
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "available_roles": ["administrator", "clinician", "read_only"]
}
```

### POST /api/users

Create a new user.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** Administrator

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "clinician",
  "title": "Dr.",
  "department": "Psychiatry",
  "license_number": "MD12345",
  "send_welcome_email": true
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "clinician"
  },
  "temporary_password": "SecureTemp123!",
  "password_change_required": true,
  "welcome_email_sent": true
}
```

**Rate Limit:** 5 requests per hour

## Audit and Compliance

### GET /api/audit/logs

List audit logs with comprehensive filtering.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** Administrator

**Query Parameters:**
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `event_type`: Filter by specific event type
- `event_category`: Filter by event category (authentication, data_access, etc.)
- `user_id`: Filter by user ID
- `phi_accessed`: Filter by PHI access events (true/false)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 50, max: 1000)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2025-06-09T10:00:00Z",
      "event_type": "template_access",
      "user_id": "uuid",
      "action": "READ",
      "resource_type": "template",
      "resource_id": "uuid",
      "ip_address": "192.168.1.100",
      "phi_accessed": false,
      "details": {
        "template_name": "Progress Note Template"
      },
      "user_info": {
        "username": "jdoe",
        "email": "john.doe@example.com",
        "role": "clinician"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 1,
    "pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "filters": {
    "date_range": {
      "start": "2025-05-09T10:00:00Z",
      "end": "2025-06-09T10:00:00Z"
    },
    "available_categories": ["authentication", "data_access", "data_modification", "system_events", "ai_interactions"]
  }
}
```

### GET /api/audit/reports/access

Generate PHI access report for compliance.

**Headers:** `Authorization: Bearer <token>`  
**Required Role:** Administrator

**Query Parameters:**
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `user_id`: Filter by specific user (optional)

**Response:**
```json
{
  "report_period": {
    "start": "2025-05-01T00:00:00Z",
    "end": "2025-06-09T23:59:59Z"
  },
  "summary_statistics": {
    "total_phi_access_events": 156,
    "unique_users_accessing_phi": 12,
    "most_active_day": ["2025-06-05", 25],
    "most_accessed_resource_type": ["template", 89]
  },
  "user_access_summary": [
    {
      "user_id": "uuid",
      "access_count": 45,
      "last_access": "2025-06-09T09:30:00Z",
      "event_types": ["template_populate", "template_access"],
      "user_info": {
        "username": "jdoe",
        "email": "john.doe@example.com",
        "role": "clinician"
      }
    }
  ],
  "daily_access_counts": {
    "2025-06-09": 15,
    "2025-06-08": 12
  },
  "resource_type_breakdown": {
    "template": 89,
    "user": 67
  }
}
```

## Health and Monitoring

### GET /health

System health check endpoint.

**No Authentication Required**

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-09T10:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## Error Responses

All API endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Invalid request format",
  "details": ["Field 'name' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Security Considerations

### HIPAA Compliance
- All PHI access is logged with detailed audit trails
- Data encryption at rest using AES-256
- TLS 1.2+ required for all communications
- Automatic de-identification capabilities
- 6-year audit log retention (configurable)

### Authentication Security
- JWT tokens with short expiration times
- Account lockout after failed login attempts
- Password complexity requirements
- MFA support (planned)

### Rate Limiting
- Aggressive rate limiting on authentication endpoints
- API rate limiting to prevent abuse
- IP-based blocking for suspicious activity

### Input Validation
- Comprehensive input sanitization
- SQL injection prevention
- XSS protection
- File upload restrictions

### Monitoring
- Real-time security event monitoring
- Automated PHI detection and alerting
- Performance metrics and health checks
- Comprehensive error logging

## Integration Examples

### Python Client Example

```python
import requests
import json

class MeDocProClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = self._authenticate(username, password)
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        })
    
    def _authenticate(self, username, password):
        response = self.session.post(f'{self.base_url}/auth/login', json={
            'username': username,
            'password': password
        })
        response.raise_for_status()
        return response.json()['access_token']
    
    def get_templates(self, category=None):
        params = {'category': category} if category else {}
        response = self.session.get(f'{self.base_url}/templates', params=params)
        response.raise_for_status()
        return response.json()
    
    def enhance_text(self, text, enhancement_type='clinical', intensity=50):
        response = self.session.post(f'{self.base_url}/ai/enhance', json={
            'text': text,
            'enhancement_type': enhancement_type,
            'intensity': intensity,
            'style': 'professional'
        })
        response.raise_for_status()
        return response.json()['enhanced_text']

# Usage
client = MeDocProClient('https://localhost:5000/api', 'username', 'password')
templates = client.get_templates(category='progress')
enhanced = client.enhance_text('Patient feels better today.')
```

### JavaScript/Node.js Client Example

```javascript
class MeDocProClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
    }
    
    async authenticate(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) throw new Error('Authentication failed');
        
        const data = await response.json();
        this.token = data.access_token;
        return data;
    }
    
    async apiRequest(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    }
    
    async getTemplates(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.apiRequest(`/templates?${params}`);
    }
    
    async enhanceText(text, options = {}) {
        return this.apiRequest('/ai/enhance', {
            method: 'POST',
            body: JSON.stringify({
                text,
                enhancement_type: options.type || 'clinical',
                intensity: options.intensity || 50,
                style: options.style || 'professional'
            })
        });
    }
}

// Usage
const client = new MeDocProClient('https://localhost:5000/api');
await client.authenticate('username', 'password');
const templates = await client.getTemplates({ category: 'progress' });
const enhanced = await client.enhanceText('Patient reports improvement.');
```

## Support and Resources

- **GitHub Repository:** [medocpro-backend](https://github.com/your-org/medocpro-backend)
- **Documentation:** [docs.medocpro.com](https://docs.medocpro.com)
- **API Status:** [status.medocpro.com](https://status.medocpro.com)
- **Support Email:** support@medocpro.com

## Changelog

### Version 1.0.0 (2025-06-09)
- Initial release
- Complete authentication system with JWT
- Template management with AI enhancement zones
- AI-powered text enhancement with PHI protection
- Comprehensive audit logging for HIPAA compliance
- User management and role-based access control
- Rate limiting and security features