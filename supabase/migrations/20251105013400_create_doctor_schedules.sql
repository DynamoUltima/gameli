-- Create doctor_schedules table to manage doctor availability
CREATE TABLE public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  start_time TIME NOT NULL,     -- e.g., '09:00:00'
  end_time TIME NOT NULL,       -- e.g., '17:00:00'
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, day_of_week)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view schedules
CREATE POLICY "Anyone can view doctor schedules"
ON public.doctor_schedules
FOR SELECT
TO authenticated
USING (true);

-- Doctors can manage their own schedules
CREATE POLICY "Doctors can manage their own schedules"
ON public.doctor_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE doctors.id = doctor_schedules.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- Admins can manage all schedules
CREATE POLICY "Admins can manage all schedules"
ON public.doctor_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_doctor_schedules_doctor_id ON public.doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day_available ON public.doctor_schedules(day_of_week, is_available);

-- Create function to check if a doctor is available at a specific time
CREATE OR REPLACE FUNCTION public.is_doctor_available(
  _doctor_id UUID,
  _check_time TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_schedules ds
    WHERE ds.doctor_id = _doctor_id
      AND ds.day_of_week = EXTRACT(DOW FROM _check_time)
      AND ds.is_available = true
      AND _check_time::time BETWEEN ds.start_time AND ds.end_time
      AND NOT EXISTS (
        -- Check for overlapping appointments
        SELECT 1
        FROM public.appointments a
        WHERE a.doctor_id = _doctor_id
          AND a.status != 'cancelled'
          AND tsrange(a.scheduled_at, a.scheduled_at + (a.duration_minutes * interval '1 minute'), '[)') 
            && tsrange(_check_time, _check_time + (30 * interval '1 minute'), '[)')
      )
  );
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_schedules_updated_at
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
