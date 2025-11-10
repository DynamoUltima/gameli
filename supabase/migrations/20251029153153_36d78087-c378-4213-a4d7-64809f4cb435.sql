-- Create specialties table for medical fields/clinics
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  license_number TEXT,
  years_of_experience INTEGER,
  consultation_fee DECIMAL(10, 2),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specialties (everyone can view, only admins can modify)
CREATE POLICY "Anyone can view specialties"
ON public.specialties
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert specialties"
ON public.specialties
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update specialties"
ON public.specialties
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete specialties"
ON public.specialties
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for doctors (patients can view, admins can manage, doctors can view their own)
CREATE POLICY "Anyone can view doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert doctors"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctors"
ON public.doctors
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can update their own profile"
ON public.doctors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete doctors"
ON public.doctors
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default specialties
INSERT INTO public.specialties (name, description) VALUES
('Fertility', 'Reproductive health and fertility treatments'),
('Gynaecology', 'Women''s reproductive health'),
('Obstetrics', 'Pregnancy and childbirth care'),
('Paediatrics', 'Child healthcare'),
('General Practice', 'Primary healthcare services');