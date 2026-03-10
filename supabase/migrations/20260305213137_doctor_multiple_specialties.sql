-- Create junction table for doctors and specialties
CREATE TABLE IF NOT EXISTS public.doctor_specialties (
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (doctor_id, specialty_id)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all users" ON public.doctor_specialties 
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated and authorized users" ON public.doctor_specialties 
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role IN ('admin', 'doctor')
      )
    );

-- Best effort data migration for existing specialties
INSERT INTO public.doctor_specialties (doctor_id, specialty_id)
SELECT id, specialty_id 
FROM public.doctors 
WHERE specialty_id IS NOT NULL 
ON CONFLICT (doctor_id, specialty_id) DO NOTHING;
