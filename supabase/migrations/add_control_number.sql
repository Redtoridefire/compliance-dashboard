-- Add control_number column to control_implementations table
-- This stores the human-readable control ID (like "500.02(a)") for better matching

ALTER TABLE control_implementations
ADD COLUMN IF NOT EXISTS control_number VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_control_implementations_control_number
ON control_implementations(control_number);
