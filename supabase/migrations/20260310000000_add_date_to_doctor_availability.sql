-- Add specific date column to allow overriding or assigning slots to exact dates
ALTER TABLE public.doctor_availability
ADD COLUMN date DATE;
