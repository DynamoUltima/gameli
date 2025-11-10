import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty_id: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
  specialties?: Specialty;
}

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDoctors = async () => {
    try {
      const { data: doctorsData, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for each doctor
      const doctorsWithProfiles = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', doctor.user_id)
            .maybeSingle();

          const { data: specialtyData } = await supabase
            .from('specialties')
            .select('id, name, description, created_at')
            .eq('id', doctor.specialty_id)
            .maybeSingle();

          return {
            ...doctor,
            profiles: profileData,
            specialties: specialtyData,
          };
        })
      );

      setDoctors(doctorsWithProfiles);
    } catch (error: any) {
      toast({
        title: 'Error fetching doctors',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (error) throw error;
      setSpecialties(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching specialties',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDoctors(), fetchSpecialties()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return { doctors, specialties, loading, fetchDoctors, fetchSpecialties };
};
