-- migration.sql
-- User table migration for MeDocPro

-- Update existing user data first
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

-- Add NOT NULL constraints
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
