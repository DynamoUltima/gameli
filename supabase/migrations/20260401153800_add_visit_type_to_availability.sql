-- Add visit_type column to doctor_availability table
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'hospital';

-- Add check constraint to ensure only valid visit types are used
ALTER TABLE doctor_availability ADD CONSTRAINT check_visit_type CHECK (visit_type IN ('online', 'home', 'hospital'));
