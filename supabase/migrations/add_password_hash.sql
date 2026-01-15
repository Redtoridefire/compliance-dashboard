-- Migration: Add password_hash column to users table
-- Run this in your Supabase SQL editor

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- Comment for documentation
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for user authentication';
