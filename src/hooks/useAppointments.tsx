import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_type: 'online' | 'hospital' | 'home';
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    phone?: string;
  };
  doctors?: {
    id: string;
    profiles?: {
      id: string;
      full_name: string;
    };
    specialties?: {
      id: string;
      name: string;
    };
  };
}

interface UseAppointmentsOptions {
  doctorId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export const useAppointments = (options: UseAppointmentsOptions = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('appointments')
          .select(`
            *,
            profiles!appointments_patient_id_fkey (
              id,
              full_name,
              phone
            ),
            doctors!appointments_doctor_id_fkey (
              id,
              profiles (
                id,
                full_name
              ),
              specialties (
                id,
                name
              )
            )
          `);

        // Apply filters
        if (options.doctorId) {
          query = query.eq('doctor_id', options.doctorId);
        }

        if (options.patientId) {
          query = query.eq('patient_id', options.patientId);
        }

        if (options.startDate) {
          query = query.gte('appointment_date', options.startDate.toISOString());
        }

        if (options.endDate) {
          query = query.lte('appointment_date', options.endDate.toISOString());
        }

        if (options.status) {
          query = query.eq('status', options.status);
        }

        // Order by appointment date
        query = query.order('appointment_date', { ascending: true });

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        console.log('Fetched appointments:', data);
        setAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [options.doctorId, options.patientId, options.startDate?.toISOString(), options.endDate?.toISOString(), options.status]);

  return { appointments, loading, error };
};

// Utility function to fetch all appointments (for admin use)
export const fetchAllAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        profiles!appointments_patient_id_fkey (
          id,
          full_name,
          phone
        ),
        doctors!appointments_doctor_id_fkey (
          id,
          profiles (
            id,
            full_name
          ),
          specialties (
            id,
            name
          )
        )
      `)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw error;
    }

    console.log('All appointments fetched:', data);
    return data;
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    throw error;
  }
};


