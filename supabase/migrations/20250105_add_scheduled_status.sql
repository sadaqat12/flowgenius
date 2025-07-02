-- Add "Scheduled" status to service_calls table
-- This migration updates the status constraint to include the new "Scheduled" status

-- Remove the existing status constraint
ALTER TABLE service_calls DROP CONSTRAINT IF EXISTS service_calls_status_check;

-- Add the new constraint with "Scheduled" status included
ALTER TABLE service_calls 
ADD CONSTRAINT service_calls_status_check 
CHECK (status IN ('New','Scheduled','InProgress','OnHold','Completed'));

-- Add comment to document the status workflow
COMMENT ON COLUMN service_calls.status IS 'Service call status: New -> Scheduled -> InProgress -> (OnHold) -> Completed'; 