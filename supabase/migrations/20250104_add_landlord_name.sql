-- Add landlord_name column to service_calls table
-- Run this migration after the initial schema

-- Add the landlord_name column as optional text field
ALTER TABLE service_calls 
ADD COLUMN IF NOT EXISTS landlord_name TEXT;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN service_calls.landlord_name IS 'Optional landlord name for billing and tracking purposes'; 