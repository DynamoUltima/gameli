-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('online', 'hospital', 'home')),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view their appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'doctor'
    )
    AND doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Patients can create their own appointments
CREATE POLICY "Patients can create appointments"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments
CREATE POLICY "Patients can update their own appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Doctors and admins can update appointments
CREATE POLICY "Doctors and admins can update appointments"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('doctor', 'admin')
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Add comments
COMMENT ON TABLE public.appointments IS 'Stores patient appointments';
COMMENT ON COLUMN public.appointments.patient_id IS 'Patient user ID';
COMMENT ON COLUMN public.appointments.doctor_id IS 'Assigned doctor ID';
COMMENT ON COLUMN public.appointments.appointment_type IS 'Type of appointment (online, hospital, home)';
COMMENT ON COLUMN public.appointments.appointment_date IS 'Date of the appointment';
COMMENT ON COLUMN public.appointments.appointment_time IS 'Time of the appointment';
COMMENT ON COLUMN public.appointments.status IS 'Appointment status';
