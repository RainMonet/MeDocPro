<#
.SYNOPSIS
    Creates the necessary Python model files for the MeDocPro project.
.DESCRIPTION
    This script generates the user.py, template.py, and audit_log.py files
    inside the /models directory. It will create the directory if it doesn't exist
    and will not overwrite existing files by default.
.EXAMPLE
    .\create_models.ps1
    This will create the three required model files in ./models.
#>

# --- Script Configuration ---
$ModelsPath = ".\models"

# Color definitions for output
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'
$Red = 'Red'

# --- Helper Functions (Using plain text to avoid encoding issues) ---
function Write-Success { param([string]$Message) Write-Host "[+] $Message" -ForegroundColor $Green }
function Write-Info    { param([string]$Message) Write-Host "[*] $Message" -ForegroundColor $Blue }
function Write-Warning { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor $Yellow }
function Write-Error   { param([string]$Message) Write-Host "[-] $Message" -ForegroundColor $Red }

# --- File Content Definitions ---
# Using arrays of single-quoted strings for robustness. This prevents PowerShell from
# attempting to parse the Python code.

# Content for models/user.py
$UserFileContent = @(
    '# MeDocPro/models/user.py',
    '',
    'from . import db',
    'from datetime import datetime',
    '',
    'class User(db.Model):',
    '    """Represents a user in the system."""',
    "    __tablename__ = 'user'",
    '    ',
    '    id = db.Column(db.Integer, primary_key=True)',
    "    username = db.Column(db.String(80), unique=True, nullable=False)",
    "    email = db.Column(db.String(120), unique=True, nullable=False)",
    "    password_hash = db.Column(db.String(255), nullable=False)",
    '    created_at = db.Column(db.DateTime, default=datetime.utcnow)',
    '',
    '    def __repr__(self):',
    "        return f'<User {self.username}>'"
)

# Content for models/template.py
$TemplateFileContent = @(
    '# MeDocPro/models/template.py',
    '',
    'from . import db',
    '',
    'class Template(db.Model):',
    '    """Represents a documentation template."""',
    "    __tablename__ = 'template'",
    '    ',
    '    id = db.Column(db.Integer, primary_key=True)',
    "    name = db.Column(db.String(100), unique=True, nullable=False)",
    "    content = db.Column(db.Text, nullable=False)",
    '    ',
    '    def __repr__(self):',
    "        return f'<Template {self.name}>'"
)

# Content for models/audit_log.py
$AuditLogFileContent = @(
    '# MeDocPro/models/audit_log.py',
    '',
    'from . import db',
    'from datetime import datetime',
    '',
    'class AuditLog(db.Model):',
    '    """Represents an audit trail event for HIPAA compliance."""',
    "    __tablename__ = 'audit_log'",
    '    ',
    '    id = db.Column(db.Integer, primary_key=True)',
    "    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # May be a system event",
    "    action = db.Column(db.String(255), nullable=False)",
    '    timestamp = db.Column(db.DateTime, default=datetime.utcnow)',
    "    details = db.Column(db.Text, nullable=True)",
    '',
    "    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))",
    '',
    '    def __repr__(self):',
    "        return f'<AuditLog {self.id} - {self.action}>'"
)

# --- Main Script Logic ---

Write-Host "--- MeDocPro Model File Creator ---"

# Check for and create the 'models' directory
if (-not (Test-Path -Path $ModelsPath -PathType Container)) {
    Write-Info "Models directory not found. Creating it..."
    try {
        New-Item -Path $ModelsPath -ItemType Directory -Force | Out-Null
        Write-Success "Directory created: $ModelsPath"
    } catch {
        Write-Error "Failed to create directory '$ModelsPath'. Please create it manually."
        exit 1
    }
} else {
    Write-Info "Models directory already exists."
}

# Define the files to be created
$filesToCreate = @(
    @{ Path = Join-Path $ModelsPath "user.py"; Content = $UserFileContent },
    @{ Path = Join-Path $ModelsPath "template.py"; Content = $TemplateFileContent },
    @{ Path = Join-Path $ModelsPath "audit_log.py"; Content = $AuditLogFileContent }
)

# Loop through and create each file
foreach ($file in $filesToCreate) {
    if (-not (Test-Path $file.Path)) {
        Write-Info "Creating file: $($file.Path)"
        try {
            # Set-Content works with an array of strings, writing each element as a new line.
            Set-Content -Path $file.Path -Value $file.Content -Encoding UTF8
            Write-Success "Successfully created $($file.Path)"
        } catch {
            Write-Error "Failed to create file $($file.Path): $_"
        }
    } else {
        Write-Warning "File already exists, skipping: $($file.Path)"
    }
}

Write-Success "--- Model file creation process complete. ---"
