# MeDocPro Security Guide

This document outlines the security architecture, practices, and procedures for the MeDocPro backend system.

## 🔒 Security Architecture Overview

MeDocPro implements a defense-in-depth security strategy with multiple layers of protection:

### 1. Network Security
- **TLS 1.2+ Encryption**: All communications encrypted in transit
- **Certificate Management**: Proper SSL/TLS certificate handling and rotation
- **Reverse Proxy**: Nginx frontend with security headers and rate limiting
- **Network Segmentation**: Containerized services with isolated networks

### 2. Authentication & Authorization
- **JWT Tokens**: Stateless authentication with short-lived access tokens
- **Role-Based Access Control (RBAC)**: Granular permissions based on user roles
- **Account Lockout**: Automatic lockout after failed login attempts
- **Session Management**: Secure session handling with automatic expiration

### 3. Data Protection
- **Encryption at Rest**: AES-256 encryption for all PHI data
- **Encryption in Transit**: TLS encryption for all API communications
- **Key Management**: Secure generation and rotation of encryption keys
- **Data Minimization**: Collect and retain only necessary data

### 4. Application Security
- **Input Validation**: Comprehensive sanitization and validation
- **SQL Injection Protection**: Parameterized queries and ORM usage
- **XSS Prevention**: Output encoding and Content Security Policy
- **CSRF Protection**: Token-based cross-site request forgery protection

## 🛡️ Authentication Security

### JWT Implementation

**Token Types:**
- **Access Token**: Short-lived (15 minutes) for API access
- **Refresh Token**: Longer-lived (7 days) for token renewal

**Security Features:**
```python
# Token generation with secure claims
payload = {
    'user_id': str(user_id),
    'type': 'access',
    'exp': datetime.utcnow() + timedelta(minutes=15),
    'iat': datetime.utcnow(),
    'iss': 'medocpro-api',
    'aud': 'medocpro-client'
}
```

**Best Practices:**
- Tokens signed with HMAC SHA-256
- Random secret keys (256+ bits)
- Automatic token rotation
- Secure token storage on client side

### Password Security

**Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (@$!%*?&)

**Implementation:**
```python
# Password hashing with bcrypt
password_hash = generate_password_hash(
    password, 
    method='pbkdf2:sha256:260000'  # 260,000 iterations
)
```

**Additional Security:**
- Password history tracking (last 12 passwords)
- Password expiry (180 days for users, 90 for admins)
- Breach detection integration (planned)

### Account Protection

**Failed Login Protection:**
- Maximum 5 failed attempts
- 30-minute lockout period
- Exponential backoff for repeated failures
- IP-based monitoring and blocking

**Session Security:**
```python
# Secure session configuration
SESSION_COOKIE_SECURE = True      # HTTPS only
SESSION_COOKIE_HTTPONLY = True    # No JavaScript access
SESSION_COOKIE_SAMESITE = 'Strict' # CSRF protection
SESSION_TIMEOUT_MINUTES = 480     # 8-hour timeout
```

## 🔐 Data Encryption

### PHI Encryption at Rest

**Algorithm:** AES-256 with Fernet (symmetric encryption)

**Implementation:**
```python
from cryptography.fernet import Fernet

class PHIEncryption:
    def __init__(self):
        self.key = os.environ.get('ENCRYPTION_KEY')
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data):
        if isinstance(data, str):
            data = data.encode()
        return self.cipher.encrypt(data).decode()
    
    def decrypt(self, encrypted_data):
        if isinstance(encrypted_data, str):
            encrypted_data = encrypted_data.encode()
        return self.cipher.decrypt(encrypted_data).decode()
```

**Key Management:**
- Keys generated using cryptographically secure random number generators
- Environment variable storage with secure deployment practices
- Key rotation procedures (quarterly recommended)
- Backup key storage in secure key management system

### Database Security

**Connection Security:**
```python
# SSL-enabled database connections
DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"

# Connection pooling with security settings
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 3600,
    'connect_args': {
        'sslmode': 'require',
        'sslcert': '/path/to/client-cert.pem',
        'sslkey': '/path/to/client-key.pem',
        'sslrootcert': '/path/to/ca-cert.pem'
    }
}
```

**Database Hardening:**
- Dedicated database user with minimal privileges
- Network-level access restrictions
- Regular security updates and patches
- Encrypted database storage

## 🚨 Audit Logging & Monitoring

### Comprehensive Audit Trail

**Logged Events:**
- All authentication attempts (success/failure)
- PHI access and modifications
- Administrative actions
- System configuration changes
- API requests and responses (sanitized)
- Security violations and anomalies

**Audit Log Structure:**
```python
class AuditLog:
    timestamp = DateTime()          # When the event occurred
    user_id = UUID()               # Who performed the action
    event_type = String()          # What type of event
    action = String()              # CREATE, READ, UPDATE, DELETE
    resource_type = String()       # What resource was accessed
    resource_id = String()         # Specific resource identifier
    ip_address = INET()            # Source IP address
    user_agent = Text()            # Client information
    phi_accessed = Boolean()       # Whether PHI was involved
    details = JSONB()              # Additional event details
    log_hash = String()            # Integrity verification hash
```

**Log Integrity:**
```python
def generate_hash(self):
    # Chain hashes for tamper detection
    last_log = AuditLog.query.order_by(AuditLog.timestamp.desc()).first()
    self.previous_log_hash = last_log.log_hash if last_log else '0'
    
    # Generate hash of current entry
    hash_data = f"{self.user_id}{self.event_type}{self.timestamp}{self.details}"
    self.log_hash = hashlib.sha256(hash_data.encode()).hexdigest()
```

### Real-time Monitoring

**Security Event Detection:**
- Multiple failed login attempts from same IP
- Unusual access patterns or data volumes
- Administrative privilege escalation
- Off-hours system access
- Geographic anomalies in access patterns

**Automated Responses:**
- Temporary IP blocking for suspicious activity
- Account lockout for brute force attempts
- Administrative alerts for critical events
- Automatic log rotation and archival

## 🔍 Input Validation & Sanitization

### API Input Validation

**Request Validation:**
```python
def validate_template_data(data, is_update=False):
    errors = []
    
    # Validate required fields
    if not is_update or 'name' in data:
        name = data.get('name', '').strip()
        if not name:
            errors.append('Template name is required')
        elif len(name) > 200:
            errors.append('Template name too long')
    
    # Validate for PHI patterns
    phi_patterns = [
        r'\d{3}-\d{2}-\d{4}',  # SSN
        r'\(\d{3}\)\s?\d{3}-\d{4}',  # Phone
        r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'  # Email
    ]
    
    content = data.get('content', '')
    for pattern in phi_patterns:
        if re.search(pattern, content):
            errors.append('Content contains potential PHI. Use placeholders.')
            break
    
    return errors
```

**SQL Injection Prevention:**
```python
# Always use parameterized queries
user = User.query.filter(User.username == username).first()

# Never use string concatenation
# BAD: query = f"SELECT * FROM users WHERE username = '{username}'"
# GOOD: Use SQLAlchemy ORM or parameterized queries
```

**XSS Prevention:**
```python
from markupsafe import escape

def sanitize_output(data):
    if isinstance(data, str):
        return escape(data)
    elif isinstance(data, dict):
        return {key: sanitize_output(value) for key, value in data.items()}
    return data
```

## 🌐 Network Security

### HTTPS/TLS Configuration

**Nginx TLS Settings:**
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 10m;
ssl_session_tickets off;

# HSTS header
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

**Security Headers:**
```nginx
# Security headers for all responses
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
```

### Rate Limiting

**API Rate Limits:**
```python
# Different limits for different endpoint types
@limiter.limit("5 per minute")  # Authentication endpoints
@limiter.limit("10 per second") # General API endpoints  
@limiter.limit("30 per hour")   # AI enhancement endpoints
@limiter.limit("3 per hour")    # Administrative actions
```

**DDoS Protection:**
- Nginx rate limiting at network level
- Application-level rate limiting with Redis
- Geographic IP filtering (if needed)
- Cloudflare or similar CDN protection (production)

## 🔧 PHI Protection

### Automatic De-identification

**PHI Detection Patterns:**
```python
PHI_PATTERNS = {
    'names': [
        r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Full names
        r'\b[A-Z][a-z]+, [A-Z][a-z]+\b'  # Last, First format
    ],
    'dates': [
        r'\b\d{1,2}\/\d{1,2}\/\d{4}\b',  # MM/DD/YYYY
        r'\b\d{4}-\d{2}-\d{2}\b'         # YYYY-MM-DD
    ],
    'identifiers': [
        r'\b\d{3}-\d{2}-\d{4}\b',        # SSN
        r'\b[A-Z]{2}\d{6,8}\b'           # License numbers
    ],
    'contact': [
        r'\b\d{3}-\d{3}-\d{4}\b',        # Phone numbers
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'  # Email
    ]
}
```

**De-identification Process:**
1. **Detection**: Scan text for PHI patterns
2. **Classification**: Categorize detected PHI
3. **Replacement**: Replace with appropriate placeholders
4. **Verification**: Confirm no PHI remains in output

### AI Safety

**PHI Scrubbing for AI Processing:**
```python
def process_ai_request(text, user_id):
    # 1. Detect PHI in input
    phi_detected = detect_phi_patterns(text)
    
    # 2. De-identify if PHI found
    if phi_detected:
        clean_text, replacements = deidentify_text(text)
    else:
        clean_text = text
        replacements = []
    
    # 3. Process with AI
    ai_response = call_ollama_api(clean_text)
    
    # 4. Check AI response for PHI
    response_phi = detect_phi_patterns(ai_response)
    
    # 5. Log interaction
    log_ai_interaction(
        user_id=user_id,
        input_phi_detected=len(phi_detected) > 0,
        output_phi_detected=len(response_phi) > 0,
        deidentification_applied=len(replacements) > 0
    )
    
    return ai_response, response_phi
```

## 🔨 Development Security

### Secure Development Practices

**Code Review Requirements:**
- All code changes require review
- Security-focused review for sensitive components
- Automated security scanning with tools like Bandit
- Dependency vulnerability scanning

**Environment Security:**
```bash
# Development environment isolation
FLASK_ENV=development
DEBUG=True  # Only in development
SECRET_KEY=development_key_not_for_production

# Production environment hardening
FLASK_ENV=production
DEBUG=False
SECRET_KEY=secure_random_production_key
```

**Secret Management:**
```python
# Never commit secrets to version control
# Use environment variables or secure secret management
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")
```

### Testing Security

**Security Test Categories:**
```python
# Authentication tests
def test_invalid_token_rejected():
    response = client.get('/api/templates', 
                         headers={'Authorization': 'Bearer invalid_token'})
    assert response.status_code == 401

# Input validation tests  
def test_sql_injection_prevented():
    malicious_input = "'; DROP TABLE users; --"
    response = client.post('/api/auth/login', 
                          json={'username': malicious_input, 'password': 'test'})
    assert response.status_code == 400

# PHI protection tests
def test_phi_detection_accuracy():
    test_text = "Patient John Smith (SSN: 123-45-6789) was seen today."
    phi_detected = detect_phi_patterns(test_text)
    assert len(phi_detected) >= 2  # Name and SSN
```

## 🚨 Incident Response

### Security Incident Classification

**Severity Levels:**
- **Critical**: Active breach, PHI exposed, system compromise
- **High**: Attempted breach, security control failure
- **Medium**: Policy violation, suspicious activity
- **Low**: Minor security event, false positive

### Incident Response Procedures

**Immediate Response (0-1 hours):**
1. **Containment**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Notification**: Alert security team and management
4. **Preservation**: Secure evidence and logs

**Investigation (1-24 hours):**
1. **Forensics**: Detailed analysis of the incident
2. **Root Cause**: Identify how the incident occurred
3. **Impact Assessment**: Determine data/system impact
4. **Documentation**: Record all findings and actions

**Recovery (24-72 hours):**
1. **System Restoration**: Safely restore services
2. **Security Hardening**: Implement additional controls
3. **Monitoring**: Enhanced monitoring for related threats
4. **Validation**: Confirm systems are secure and functional

**Post-Incident (72+ hours):**
1. **Lessons Learned**: Document improvements needed
2. **Process Updates**: Update procedures and controls
3. **Training**: Additional security awareness training
4. **Compliance**: Regulatory notifications if required

### Automated Incident Detection

**Monitoring Rules:**
```python
# Suspicious login patterns
if failed_login_count > 10 and time_window < 300:  # 10 failures in 5 minutes
    trigger_incident_alert("Potential brute force attack", ip_address)

# Unusual data access
if phi_access_count > normal_baseline * 3:
    trigger_incident_alert("Unusual PHI access pattern", user_id)

# System anomalies
if error_rate > 0.05:  # 5% error rate
    trigger_incident_alert("High error rate detected", service_name)
```

## 📊 Security Metrics & KPIs

### Key Security Metrics

**Authentication Metrics:**
- Failed login attempt rate
- Account lockout frequency
- Password reset requests
- Token expiration compliance

**Access Control Metrics:**
- Privilege escalation attempts
- Unauthorized access attempts
- Role assignment accuracy
- Permission review completion

**Data Protection Metrics:**
- Encryption coverage percentage
- PHI exposure incidents
- De-identification accuracy
- Data retention compliance

**System Security Metrics:**
- Vulnerability scan results
- Patch management compliance
- Security control effectiveness
- Incident response time

### Security Dashboards

**Real-time Monitoring:**
- Active user sessions
- API request patterns
- Error rates and anomalies
- Security event timeline

**Weekly Reports:**
- Security incident summary
- Vulnerability assessment results
- Compliance status updates
- User access review findings

**Monthly Reviews:**
- Security control effectiveness
- Threat landscape updates
- Policy compliance metrics
- Security training completion

## 🛠️ Security Tools & Integration

### Security Scanning Tools

**Static Analysis:**
```bash
# Python security linting
bandit -r . -f json -o security_report.json

# Dependency vulnerability scanning
safety check

# Code quality and security
flake8 --select=E,W,F,C,N
```

**Dynamic Testing:**
```bash
# API security testing
pytest tests/security/ -v

# Load testing with security focus
locust -f security_load_test.py --host=https://localhost:5000
```

### Monitoring Integration

**Log Aggregation:**
```python
# Structured logging for security events
import structlog

security_logger = structlog.get_logger("security")

def log_security_event(event_type, user_id, details):
    security_logger.info(
        "Security event detected",
        event_type=event_type,
        user_id=user_id,
        timestamp=datetime.utcnow().isoformat(),
        details=details
    )
```

**Alerting Rules:**
```yaml
# Prometheus alerting rules
groups:
  - name: security_alerts
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_logins_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High failed login rate detected"
```

## 📚 Security Training & Awareness

### Developer Security Training

**Required Topics:**
- Secure coding practices
- OWASP Top 10 vulnerabilities
- PHI handling procedures
- Incident response procedures
- Threat modeling basics

**Regular Updates:**
- Monthly security newsletters
- Quarterly security workshops
- Annual security awareness training
- Threat intelligence briefings

### Security Documentation

**Maintained Documents:**
- Security architecture diagrams
- Data flow security analysis
- Threat model documentation
- Incident response playbooks
- Security control matrix

## 🔍 Security Auditing

### Internal Audits

**Monthly Reviews:**
- Access control effectiveness
- Log analysis and anomaly detection
- Vulnerability assessment results
- Compliance gap analysis

**Quarterly Assessments:**
- Penetration testing
- Security control testing
- Policy compliance review
- Risk assessment updates

### External Audits

**Annual Requirements:**
- HIPAA security audit
- Third-party penetration testing
- Compliance certification review
- Risk assessment validation

**Continuous Monitoring:**
- Automated vulnerability scanning
- Real-time threat monitoring
- Compliance dashboard tracking
- Security metrics reporting

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team before implementing new features or making changes that could affect system security.

For security incidents or questions, contact: security@medocpro.com