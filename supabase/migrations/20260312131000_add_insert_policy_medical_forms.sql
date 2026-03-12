-- Add missing INSERT policy for medical_forms
CREATE POLICY "Patients can insert their own forms" ON public.medical_forms
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
