-- Add hospital_card_id field to profiles table
-- This is the physical card number given to patients on their first hospital visit

ALTER TABLE public.profiles
ADD COLUMN hospital_card_id VARCHAR(50) UNIQUE;

-- Create an index for faster lookups
CREATE INDEX idx_profiles_hospital_card_id ON public.profiles(hospital_card_id);

-- Add a comment to explain the field
COMMENT ON COLUMN public.profiles.hospital_card_id IS 'Physical hospital card ID given to patients on first visit';

