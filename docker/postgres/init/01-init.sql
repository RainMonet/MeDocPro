-- MeDocPro PostgreSQL Initialization Script
-- Creates database extensions and initial configuration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create database if it doesn't exist (for production)
-- Note: This won't work in Docker init scripts as DB already exists
-- SELECT 'CREATE DATABASE medocpro' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medocpro')\gexec

-- Set default timezone
SET timezone = 'UTC';

-- Configure full-text search
-- Create custom text search configuration for medical terms
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'medical_english') THEN
        CREATE TEXT SEARCH CONFIGURATION medical_english (COPY = english);
        
        -- Add medical synonyms and terms
        ALTER TEXT SEARCH CONFIGURATION medical_english
        ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
        WITH unaccent, simple;
    END IF;
END $$;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function for audit logging
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be used for HIPAA audit logging
    -- Implementation will be added by the application
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Performance optimizations
-- Set shared_preload_libraries in postgresql.conf if needed
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Create indexes that will be commonly used
-- Note: Actual table indexes will be created by SQLAlchemy migrations

-- Grant permissions to application user
GRANT CONNECT ON DATABASE medocpro_test TO medocpro;
GRANT USAGE ON SCHEMA public TO medocpro;
GRANT CREATE ON SCHEMA public TO medocpro;

-- Ensure the application user can create temporary tables
GRANT TEMPORARY ON DATABASE medocpro_test TO medocpro;

-- Set up connection limits
ALTER USER medocpro CONNECTION LIMIT 50;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'MeDocPro database initialization completed successfully';
END $$;