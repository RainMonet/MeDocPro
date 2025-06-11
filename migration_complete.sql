-- migration.sql
-- User table migration for MeDocPro

-- First, add all the missing columns
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS title VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'clinician',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing user data
UPDATE "user" 
SET 
    role = 'administrator',
    is_active = TRUE,
    is_deleted = FALSE,
    failed_login_count = 0,
    password_changed_at = created_at,
    mfa_enabled = FALSE,
    updated_at = NOW()
WHERE username = 'RainMonet';

-- Add NOT NULL constraints after setting values
ALTER TABLE "user" 
ALTER COLUMN role SET NOT NULL;

ALTER TABLE "user" 
ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE "user" 
ALTER COLUMN is_deleted SET NOT NULL;

ALTER TABLE "user" 
ALTER COLUMN failed_login_count SET NOT NULL;

ALTER TABLE "user" 
ALTER COLUMN password_changed_at SET NOT NULL;

ALTER TABLE "user" 
ALTER COLUMN mfa_enabled SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);
CREATE INDEX IF NOT EXISTS idx_user_active ON "user"(is_active);
CREATE INDEX IF NOT EXISTS idx_user_deleted ON "user"(is_deleted);
