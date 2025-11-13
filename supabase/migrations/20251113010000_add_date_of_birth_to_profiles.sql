-- Add date_of_birth field to profiles table
-- This stores the patient's date of birth for age calculation and records

ALTER TABLE public.profiles
ADD COLUMN date_of_birth DATE;

-- Create an index for faster lookups
CREATE INDEX idx_profiles_date_of_birth ON public.profiles(date_of_birth);

-- Add a comment to explain the field
COMMENT ON COLUMN public.profiles.date_of_birth IS 'Patient date of birth for age calculation and medical records';

