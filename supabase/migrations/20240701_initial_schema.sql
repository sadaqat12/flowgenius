-- Service Call Manager Database Schema
-- Initial migration for service calls and work logs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service calls table
CREATE TABLE IF NOT EXISTS service_calls (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  problem_desc TEXT NOT NULL,
  call_type TEXT CHECK(call_type IN ('Landlord','Extra','Warranty')) NOT NULL,
  status TEXT CHECK(status IN ('New','InProgress','OnHold','Completed')) DEFAULT 'New',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work logs table
CREATE TABLE IF NOT EXISTS work_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  call_id TEXT NOT NULL,
  notes TEXT NOT NULL,
  parts_used TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (call_id) REFERENCES service_calls(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_calls_status ON service_calls(status);
CREATE INDEX IF NOT EXISTS idx_service_calls_created_at ON service_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_service_calls_scheduled_at ON service_calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_work_logs_call_id ON work_logs(call_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (modify as needed for your security requirements)
CREATE POLICY "Enable all operations for service_calls" ON service_calls FOR ALL USING (true);
CREATE POLICY "Enable all operations for work_logs" ON work_logs FOR ALL USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on service_calls
CREATE TRIGGER update_service_calls_updated_at 
    BEFORE UPDATE ON service_calls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 