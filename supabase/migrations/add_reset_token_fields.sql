-- Migration: Add password reset token fields to users table
-- Run this in your Supabase SQL editor

-- Add reset token fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;

-- Create index for faster reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token) WHERE reset_token IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN users.reset_token IS 'Temporary token for password reset verification';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration timestamp for the reset token';
