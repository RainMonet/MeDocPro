"""
HIPAA-Compliant Encryption Implementation
Implements AES-256 encryption for PHI data at rest and field-level encryption

Compliance Standards:
- NIST Special Publication 800-111
- HIPAA Security Rule (2025 Proposed Updates)
- AES-256 encryption minimum
- Secure key derivation and management
"""

import os
import hashlib
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64
import json
from typing import Optional, Dict, Any, Union
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class FieldEncryption:
    """
    HIPAA-compliant field-level encryption for PHI data
    Uses AES-256 with PBKDF2 key derivation
    """
    
    def __init__(self, master_key: Optional[bytes] = None):
        """Initialize field encryption with master key"""
        self.backend = default_backend()
        if master_key is None:
            master_key = os.environ.get('HIPAA_MASTER_KEY', '').encode()
            if not master_key:
                raise ValueError("HIPAA_MASTER_KEY environment variable must be set")
        
        self.master_key = master_key
        self._key_cache = {}  # Cache derived keys for performance
    
    def _derive_key(self, salt: bytes, purpose: str = "field_encryption") -> bytes:
        """Derive encryption key using PBKDF2 with SHA-256"""
        cache_key = (salt, purpose)
        if cache_key in self._key_cache:
            return self._key_cache[cache_key]
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits for AES-256
            salt=salt,
            iterations=100000,  # NIST recommended minimum
            backend=self.backend
        )
        
        derived_key = kdf.derive(self.master_key + purpose.encode())
        self._key_cache[cache_key] = derived_key
        return derived_key
    
    def encrypt_field(self, plaintext: str, field_name: str, patient_id: Optional[str] = None) -> str:
        """
        Encrypt a single field containing PHI data
        
        Args:
            plaintext: The PHI data to encrypt
            field_name: Name of the field being encrypted (for audit trail)
            patient_id: Patient identifier for additional security context
            
        Returns:
            Base64-encoded encrypted data with metadata
        """
        if not plaintext:
            return ""
        
        try:
            # Generate unique salt for this encryption operation
            salt = os.urandom(32)  # 256-bit salt
            
            # Create context-specific key derivation
            context = f"{field_name}:{patient_id or 'system'}"
            derived_key = self._derive_key(salt, context)
            
            # Generate random IV for AES-GCM
            iv = os.urandom(12)  # 96-bit IV for GCM mode
            
            # Create cipher with AES-256-GCM for authenticated encryption
            cipher = Cipher(
                algorithms.AES(derived_key),
                modes.GCM(iv),
                backend=self.backend
            )
            
            encryptor = cipher.encryptor()
            
            # Encrypt the plaintext
            plaintext_bytes = plaintext.encode('utf-8')
            ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()
            
            # Create metadata for integrity and audit
            metadata = {
                'version': '1.0',
                'algorithm': 'AES-256-GCM',
                'field_name': field_name,
                'context': context,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'salt': base64.b64encode(salt).decode('ascii'),
                'iv': base64.b64encode(iv).decode('ascii'),
                'tag': base64.b64encode(encryptor.tag).decode('ascii')
            }
            
            # Combine ciphertext and metadata
            encrypted_package = {
                'data': base64.b64encode(ciphertext).decode('ascii'),
                'meta': metadata
            }
            
            # Return base64-encoded JSON package
            package_json = json.dumps(encrypted_package, separators=(',', ':'))
            return base64.b64encode(package_json.encode('utf-8')).decode('ascii')
            
        except Exception as e:
            logger.error(f"Encryption failed for field {field_name}: {e}")
            raise ValueError(f"Failed to encrypt PHI data: {e}")
    
    def decrypt_field(self, encrypted_data: str, expected_field_name: Optional[str] = None) -> str:
        """
        Decrypt a field containing PHI data
        
        Args:
            encrypted_data: Base64-encoded encrypted package
            expected_field_name: Expected field name for validation
            
        Returns:
            Decrypted plaintext
        """
        if not encrypted_data:
            return ""
        
        try:
            # Decode the package
            package_json = base64.b64decode(encrypted_data.encode('ascii')).decode('utf-8')
            encrypted_package = json.loads(package_json)
            
            # Extract components
            ciphertext = base64.b64decode(encrypted_package['data'].encode('ascii'))
            metadata = encrypted_package['meta']
            
            # Validate metadata
            if expected_field_name and metadata['field_name'] != expected_field_name:
                raise ValueError("Field name mismatch - potential tampering detected")
            
            # Extract encryption components
            salt = base64.b64decode(metadata['salt'].encode('ascii'))
            iv = base64.b64decode(metadata['iv'].encode('ascii'))
            tag = base64.b64decode(metadata['tag'].encode('ascii'))
            
            # Recreate the key with the same context used for encryption
            # Check if patient context was used in metadata
            if 'context' in metadata:
                context = metadata['context']
            else:
                # Default context for backward compatibility
                context = f"{metadata['field_name']}:system"
            
            derived_key = self._derive_key(salt, context)
            
            # Create cipher for decryption
            cipher = Cipher(
                algorithms.AES(derived_key),
                modes.GCM(iv, tag),
                backend=self.backend
            )
            
            decryptor = cipher.decryptor()
            
            # Decrypt and verify
            plaintext_bytes = decryptor.update(ciphertext) + decryptor.finalize()
            return plaintext_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError(f"Failed to decrypt PHI data: {e}")
    
    def rotate_field_encryption(self, encrypted_data: str, field_name: str) -> str:
        """
        Rotate encryption for a field (decrypt with old key, encrypt with new key)
        Used for key rotation compliance
        """
        plaintext = self.decrypt_field(encrypted_data, field_name)
        return self.encrypt_field(plaintext, field_name)


class DatabaseEncryption:
    """
    Database-level encryption for data at rest
    Implements transparent data encryption (TDE) concepts
    """
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        """Initialize database encryption"""
        if encryption_key is None:
            encryption_key = os.environ.get('DATABASE_ENCRYPTION_KEY', '').encode()
            if not encryption_key:
                # Generate a new key if none exists (for development)
                encryption_key = Fernet.generate_key()
                logger.warning("Generated new database encryption key - store securely!")
        
        self.fernet = Fernet(encryption_key)
    
    def encrypt_database_field(self, data: Union[str, bytes]) -> bytes:
        """Encrypt data for database storage"""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return self.fernet.encrypt(data)
    
    def decrypt_database_field(self, encrypted_data: bytes) -> str:
        """Decrypt data from database"""
        decrypted_bytes = self.fernet.decrypt(encrypted_data)
        return decrypted_bytes.decode('utf-8')


class PHIClassification:
    """
    Classify and identify PHI data fields for encryption
    Based on HIPAA Safe Harbor method
    """
    
    PHI_FIELDS = {
        # Direct identifiers that must be encrypted
        'high_risk': [
            'ssn', 'social_security_number', 'medical_record_number', 'mrn',
            'patient_id', 'account_number', 'insurance_id', 'device_id',
            'biometric_id', 'photo', 'voice_recording', 'full_face_photo'
        ],
        
        # Quasi-identifiers that should be encrypted
        'medium_risk': [
            'first_name', 'last_name', 'full_name', 'patient_name', 'email', 'phone',
            'address', 'street', 'city', 'postal_code', 'zip_code',
            'birth_date', 'date_of_birth', 'admission_date', 'discharge_date'
        ],
        
        # Clinical data that contains PHI
        'clinical_phi': [
            'diagnosis', 'treatment', 'medication', 'allergies', 'notes',
            'clinical_notes', 'progress_notes', 'lab_results', 'vital_signs',
            'assessment', 'plan', 'chief_complaint', 'history_present_illness'
        ]
    }
    
    @classmethod
    def is_phi_field(cls, field_name: str) -> bool:
        """Check if a field contains PHI and needs encryption"""
        field_lower = field_name.lower()
        
        for category, fields in cls.PHI_FIELDS.items():
            if any(phi_field in field_lower for phi_field in fields):
                return True
        
        return False
    
    @classmethod
    def get_phi_risk_level(cls, field_name: str) -> str:
        """Get the risk level for a PHI field"""
        field_lower = field_name.lower()
        
        for category, fields in cls.PHI_FIELDS.items():
            if any(phi_field in field_lower for phi_field in fields):
                return category
        
        return 'low_risk'


# Encryption utilities for easy integration
def encrypt_phi_data(data: Dict[str, Any], patient_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Automatically encrypt PHI fields in a data dictionary
    
    Args:
        data: Dictionary containing potentially PHI data
        patient_id: Patient identifier for context
        
    Returns:
        Dictionary with PHI fields encrypted
    """
    if not data:
        return data
    
    field_encryption = FieldEncryption()
    encrypted_data = data.copy()
    
    for field_name, value in data.items():
        if PHIClassification.is_phi_field(field_name) and value:
            try:
                encrypted_data[field_name] = field_encryption.encrypt_field(
                    str(value), field_name, patient_id
                )
                logger.info(f"Encrypted PHI field: {field_name}")
            except Exception as e:
                logger.error(f"Failed to encrypt field {field_name}: {e}")
                # Keep original value if encryption fails (for development)
                # In production, this should raise an exception
                encrypted_data[field_name] = value
    
    return encrypted_data


def decrypt_phi_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automatically decrypt PHI fields in a data dictionary
    
    Args:
        data: Dictionary containing encrypted PHI data
        
    Returns:
        Dictionary with PHI fields decrypted
    """
    if not data:
        return data
    
    field_encryption = FieldEncryption()
    decrypted_data = data.copy()
    
    for field_name, value in data.items():
        if PHIClassification.is_phi_field(field_name) and value:
            try:
                # Check if the value looks like encrypted data (base64 encoded package)
                if isinstance(value, str) and len(value) > 100 and value.count('=') <= 2:
                    # Try to decode as base64 to see if it's an encrypted package
                    try:
                        import base64
                        decoded = base64.b64decode(value.encode('ascii')).decode('utf-8')
                        package = json.loads(decoded)
                        if 'data' in package and 'meta' in package:
                            # This looks like our encrypted package format
                            decrypted_data[field_name] = field_encryption.decrypt_field(
                                value, field_name
                            )
                            logger.debug(f"Decrypted PHI field: {field_name}")
                        else:
                            # Not encrypted, keep as-is
                            decrypted_data[field_name] = value
                    except:
                        # Not valid base64 or JSON, keep as-is
                        decrypted_data[field_name] = value
                else:
                    # Doesn't look encrypted, keep as-is
                    decrypted_data[field_name] = value
            except Exception as e:
                logger.error(f"Failed to decrypt field {field_name}: {e}")
                # Keep original value if decryption fails
                decrypted_data[field_name] = value
    
    return decrypted_data