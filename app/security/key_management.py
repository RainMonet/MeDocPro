"""
HIPAA-Compliant Key Management System
Implements secure key generation, rotation, and storage

Compliance Standards:
- NIST SP 800-57 (Key Management)
- HIPAA Security Rule Key Management Requirements
- HSM integration support for production environments
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List, Tuple
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

class HIPAAKeyManager:
    """
    HIPAA-compliant cryptographic key management system
    Handles key generation, rotation, and secure storage
    """
    
    def __init__(self, key_store_path: Optional[str] = None):
        """
        Initialize the key management system
        
        Args:
            key_store_path: Path to secure key storage (default: environment-based)
        """
        self.backend = default_backend()
        
        # Set up key storage path
        if key_store_path is None:
            key_store_path = os.environ.get(
                'HIPAA_KEY_STORE_PATH', 
                '/secure/keys/hipaa_keys.json'
            )
        
        self.key_store_path = key_store_path
        self.key_rotation_days = int(os.environ.get('KEY_ROTATION_DAYS', '90'))
        
        # Initialize key store
        self._ensure_key_store_exists()
        
        # Load or generate master keys
        self._initialize_master_keys()
    
    def _ensure_key_store_exists(self):
        """Ensure the key store directory and file exist"""
        key_dir = os.path.dirname(self.key_store_path)
        if key_dir and not os.path.exists(key_dir):
            os.makedirs(key_dir, mode=0o700)  # Restricted permissions
        
        if not os.path.exists(self.key_store_path):
            # Create empty key store
            initial_store = {
                'version': '1.0',
                'created': datetime.now(timezone.utc).isoformat(),
                'keys': {},
                'rotation_log': []
            }
            self._save_key_store(initial_store)
    
    def _save_key_store(self, key_store: Dict):
        """Save key store to disk with restricted permissions"""
        with open(self.key_store_path, 'w') as f:
            json.dump(key_store, f, indent=2)
        
        # Set restrictive permissions (owner read/write only)
        os.chmod(self.key_store_path, 0o600)
    
    def _load_key_store(self) -> Dict:
        """Load key store from disk"""
        try:
            with open(self.key_store_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Failed to load key store: {e}")
            return {
                'version': '1.0',
                'created': datetime.now(timezone.utc).isoformat(),
                'keys': {},
                'rotation_log': []
            }
    
    def _initialize_master_keys(self):
        """Initialize or load master encryption keys"""
        key_store = self._load_key_store()
        
        # Check if master key exists
        if 'master_key' not in key_store['keys']:
            logger.info("Generating new HIPAA master key")
            master_key = self._generate_master_key()
            
            key_store['keys']['master_key'] = {
                'key': master_key.decode('ascii'),
                'created': datetime.now(timezone.utc).isoformat(),
                'algorithm': 'PBKDF2-SHA256',
                'key_size': 256,
                'status': 'active'
            }
            
            self._save_key_store(key_store)
            logger.info("Master key generated and stored securely")
    
    def _generate_master_key(self) -> bytes:
        """Generate a cryptographically secure master key"""
        # Generate 256-bit random key material
        key_material = secrets.token_bytes(32)
        
        # Additional entropy from system
        system_entropy = os.urandom(32)
        
        # Combine and hash for final key
        combined = key_material + system_entropy
        master_key = hashlib.sha256(combined).digest()
        
        # Return as base64 for storage
        import base64
        return base64.b64encode(master_key)
    
    def get_master_key(self) -> bytes:
        """Retrieve the current master key"""
        key_store = self._load_key_store()
        
        if 'master_key' not in key_store['keys']:
            raise ValueError("Master key not found - key store may be corrupted")
        
        master_key_data = key_store['keys']['master_key']
        
        if master_key_data['status'] != 'active':
            raise ValueError("Master key is not active")
        
        import base64
        return base64.b64decode(master_key_data['key'].encode('ascii'))
    
    def generate_field_key(self, field_name: str, context: str = "") -> bytes:
        """
        Generate a field-specific encryption key
        
        Args:
            field_name: Name of the field requiring encryption
            context: Additional context for key derivation
            
        Returns:
            Field-specific encryption key
        """
        master_key = self.get_master_key()
        
        # Create unique salt for this field
        salt_input = f"{field_name}:{context}:{datetime.now().strftime('%Y-%m')}"
        salt = hashlib.sha256(salt_input.encode()).digest()
        
        # Derive field key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,
            backend=self.backend
        )
        
        return kdf.derive(master_key)
    
    def rotate_master_key(self) -> bool:
        """
        Rotate the master key (emergency use only)
        This requires re-encrypting all data with the new key
        """
        try:
            key_store = self._load_key_store()
            
            # Archive current key
            current_key = key_store['keys']['master_key']
            current_key['status'] = 'archived'
            current_key['archived'] = datetime.now(timezone.utc).isoformat()
            
            # Generate new master key
            new_master_key = self._generate_master_key()
            
            key_store['keys']['master_key'] = {
                'key': new_master_key.decode('ascii'),
                'created': datetime.now(timezone.utc).isoformat(),
                'algorithm': 'PBKDF2-SHA256',
                'key_size': 256,
                'status': 'active'
            }
            
            # Log rotation
            key_store['rotation_log'].append({
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'action': 'master_key_rotation',
                'reason': 'scheduled_rotation',
                'old_key_fingerprint': hashlib.sha256(
                    current_key['key'].encode()
                ).hexdigest()[:16]
            })
            
            self._save_key_store(key_store)
            
            logger.critical("Master key rotated - all encrypted data must be re-encrypted")
            return True
            
        except Exception as e:
            logger.error(f"Key rotation failed: {e}")
            return False
    
    def check_key_rotation_needed(self) -> bool:
        """Check if key rotation is needed based on policy"""
        key_store = self._load_key_store()
        
        if 'master_key' not in key_store['keys']:
            return True
        
        master_key = key_store['keys']['master_key']
        created = datetime.fromisoformat(master_key['created'].replace('Z', '+00:00'))
        
        # Check if key is older than rotation policy
        rotation_threshold = datetime.now(timezone.utc) - timedelta(days=self.key_rotation_days)
        
        return created < rotation_threshold
    
    def get_key_status(self) -> Dict:
        """Get current key management status"""
        key_store = self._load_key_store()
        
        status = {
            'key_store_version': key_store.get('version', 'unknown'),
            'master_key_exists': 'master_key' in key_store['keys'],
            'rotation_needed': self.check_key_rotation_needed(),
            'last_rotation': None,
            'key_count': len(key_store['keys'])
        }
        
        if key_store['rotation_log']:
            status['last_rotation'] = key_store['rotation_log'][-1]['timestamp']
        
        return status
    
    def generate_database_key(self) -> bytes:
        """Generate a key specifically for database encryption"""
        return Fernet.generate_key()
    
    def generate_transit_keypair(self) -> Tuple[bytes, bytes]:
        """
        Generate RSA key pair for data in transit encryption
        
        Returns:
            Tuple of (private_key_pem, public_key_pem)
        """
        # Generate 2048-bit RSA key pair (minimum for HIPAA)
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=self.backend
        )
        
        # Serialize private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Serialize public key
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return private_pem, public_pem
    
    def audit_key_usage(self, key_type: str, operation: str, context: Dict = None):
        """
        Log key usage for audit compliance
        
        Args:
            key_type: Type of key used ('master', 'field', 'database', etc.)
            operation: Operation performed ('encrypt', 'decrypt', 'generate', etc.)
            context: Additional context information
        """
        key_store = self._load_key_store()
        
        audit_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'key_type': key_type,
            'operation': operation,
            'context': context or {},
            'user_id': os.environ.get('HIPAA_USER_ID', 'system'),
            'session_id': os.environ.get('HIPAA_SESSION_ID', 'unknown')
        }
        
        if 'audit_log' not in key_store:
            key_store['audit_log'] = []
        
        key_store['audit_log'].append(audit_entry)
        
        # Keep only last 1000 audit entries to prevent file bloat
        if len(key_store['audit_log']) > 1000:
            key_store['audit_log'] = key_store['audit_log'][-1000:]
        
        self._save_key_store(key_store)
        
        logger.info(f"Key audit: {key_type} {operation} by {audit_entry['user_id']}")


class KeyRotationScheduler:
    """
    Automated key rotation scheduler for compliance
    """
    
    def __init__(self, key_manager: HIPAAKeyManager):
        self.key_manager = key_manager
        self.rotation_policies = {
            'master_key': 90,  # days
            'field_keys': 30,  # days  
            'database_keys': 60,  # days
            'transit_keys': 365  # days
        }
    
    def check_all_rotations(self) -> List[Dict]:
        """Check all keys for rotation requirements"""
        rotation_needed = []
        
        if self.key_manager.check_key_rotation_needed():
            rotation_needed.append({
                'key_type': 'master_key',
                'reason': 'scheduled_rotation',
                'days_overdue': self._days_overdue('master_key')
            })
        
        return rotation_needed
    
    def _days_overdue(self, key_type: str) -> int:
        """Calculate days overdue for key rotation"""
        # Implementation would check actual key ages
        return 0  # Placeholder
    
    def perform_scheduled_rotations(self) -> Dict:
        """Perform all scheduled key rotations"""
        results = {
            'rotations_performed': 0,
            'rotations_failed': 0,
            'details': []
        }
        
        rotations_needed = self.check_all_rotations()
        
        for rotation in rotations_needed:
            try:
                if rotation['key_type'] == 'master_key':
                    success = self.key_manager.rotate_master_key()
                    if success:
                        results['rotations_performed'] += 1
                        results['details'].append(f"Master key rotated successfully")
                    else:
                        results['rotations_failed'] += 1
                        results['details'].append(f"Master key rotation failed")
                        
            except Exception as e:
                results['rotations_failed'] += 1
                results['details'].append(f"Rotation failed: {e}")
        
        return results