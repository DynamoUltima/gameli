import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  cost: number | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty_id: string | null;
  years_of_experience: number | null;
  available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone: string;
  };
  specialties?: Specialty[];
}

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDoctors = async () => {
    try {
      // Pre-fetch specialties since the Firebase shim doesn't support relation joins natively
      const { data: allSpecs } = await supabase.from('specialties').select('*');
      const specialtiesMap = new Map((allSpecs || []).map((s: any) => [s.id, s]));

      const { data: rawDoctorsData, error } = await supabase
        .from('doctors')
        .select('*');

      if (error) throw error;
      
      const doctorsData = Array.isArray(rawDoctorsData) ? rawDoctorsData.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }) : [];

      // Fetch profiles separately for each doctor
      const doctorsWithProfiles = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, first_name, last_name, email, phone')
            .eq('id', doctor.user_id)
            .maybeSingle();

          const calculatedFullName = profileData?.full_name || [profileData?.first_name, profileData?.last_name].filter(Boolean).join(' ') || 'N/A';

          const { data: doctorSpecialtiesData } = await supabase
            .from('doctor_specialties')
            .select('*')
            .eq('doctor_id', doctor.id);

          const specialtyData = doctorSpecialtiesData
            ?.map((ds: any) => specialtiesMap.get(ds.specialty_id) || ds.specialties)
            .filter(Boolean) || [];

          return {
            ...doctor,
            profiles: {
              ...profileData,
              full_name: calculatedFullName
            },
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
