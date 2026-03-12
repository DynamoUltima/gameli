CREATE TABLE IF NOT EXISTS public.medical_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medical_forms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Patients can view their own forms" ON public.medical_forms
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own forms" ON public.medical_forms
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Admins and Doctors can view all forms" ON public.medical_forms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND (user_roles.role = 'admin' OR user_roles.role = 'doctor')
    )
  );

-- Trigger for updated_at
-- Try to create the function if it doesn't already exist from another migration
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_forms_modtime
BEFORE UPDATE ON public.medical_forms
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
