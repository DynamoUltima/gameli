import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;  // 'HH:MM:SS'
  end_time: string;    // 'HH:MM:SS'
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export const useDoctorSchedules = (doctorId?: string) => {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all schedules for a doctor
  const fetchSchedules = useCallback(async (id?: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setSchedules((data as DoctorSchedule[]) || []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error fetching schedules',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update or create a schedule
  const upsertSchedule = async (schedule: Omit<DoctorSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('doctor_schedules')
        .upsert({
          ...schedule,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data?.[0]) {
        setSchedules(prev => {
          const exists = prev.some(s => s.day_of_week === schedule.day_of_week);
          if (exists) {
            return prev.map(s => 
              s.day_of_week === schedule.day_of_week ? data[0] : s
            );
          }
          return [...prev, data[0]];
        });
      }
      
      return data?.[0];
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error updating schedule',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Check if a doctor is available at a specific time
  const checkAvailability = async (doctorId: string, dateTime: Date): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_doctor_available', {
        _doctor_id: doctorId,
        _check_time: dateTime.toISOString(),
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  // Get available time slots for a doctor on a specific day
  // Note: doctorId here is the user_id (from profiles/auth.users)
  const getAvailableSlots = useCallback(async (doctorId: string, date: Date): Promise<string[]> => {
    try {
      console.log('Getting available slots for doctor:', doctorId, 'on date:', date);
      
      // Get the day of week for the selected date
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      // Check if doctor has availability set for this day (can have multiple slots)
      const { data: availabilitySlots, error: availabilityError } = await supabase
        .from('doctor_availability')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek);
      
      if (availabilityError) {
        console.error('Error fetching doctor availability:', availabilityError);
      }
      
      // If no availability is set for this day, doctor doesn't work on this day
      if (!availabilitySlots || availabilitySlots.length === 0) {
        console.log('No availability set for', dayOfWeek, '- doctor does not work on this day');
        return [];
      }
      
      console.log(`Doctor has ${availabilitySlots.length} availability slot(s) for ${dayOfWeek}:`, availabilitySlots);
      
      // Generate slots for each availability period
      const allSlots: Date[] = [];
      
      availabilitySlots.forEach((availability) => {
        // Parse start_time (format: "HH:MM:SS" or "HH:MM")
        const startParts = availability.start_time.split(':');
        const startHour = parseInt(startParts[0], 10);
        const startMinute = parseInt(startParts[1] || '0', 10);
        
        // Parse end_time
        const endParts = availability.end_time.split(':');
        const endHour = parseInt(endParts[0], 10);
        const endMinute = parseInt(endParts[1] || '0', 10);
        
        console.log(`Generating slots from ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
        
        // Create slots for this availability period
        const slotDate = new Date(date);
        slotDate.setHours(startHour, startMinute, 0, 0);
        slotDate.setSeconds(0);
        slotDate.setMilliseconds(0);
        
        const endDate = new Date(date);
        endDate.setHours(endHour, endMinute, 0, 0);
        endDate.setSeconds(0);
        endDate.setMilliseconds(0);
        
        // 30-minute slots
        const slotDuration = 30 * 60 * 1000; // 30 minutes in ms
        
        while (slotDate < endDate) {
          allSlots.push(new Date(slotDate));
          slotDate.setTime(slotDate.getTime() + slotDuration);
        }
      });
      
      // Get existing appointments for this doctor on this date
      // doctorId is user_id, so we check appointments.doctor_id = doctorId
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('scheduled_at, status')
        .eq('doctor_id', doctorId)
        .gte('scheduled_at', dateStart.toISOString())
        .lte('scheduled_at', dateEnd.toISOString())
        .neq('status', 'cancelled'); // Exclude cancelled appointments
      
      if (appointmentsError) {
        console.error('Error fetching existing appointments:', appointmentsError);
      }
      
      // Create a set of booked times (rounded to nearest 30 minutes)
      const bookedTimes = new Set<string>();
      if (existingAppointments) {
        existingAppointments.forEach((apt: any) => {
          const aptDate = new Date(apt.scheduled_at);
          // Round to nearest 30 minutes
          const minutes = aptDate.getMinutes();
          const roundedMinutes = minutes < 30 ? 0 : 30;
          aptDate.setMinutes(roundedMinutes, 0, 0);
          bookedTimes.add(aptDate.toISOString());
        });
      }
      
      // Filter out booked slots and past times (if selecting today)
      const now = new Date();
      const availableSlots = allSlots
        .filter(slot => {
          // Don't show past times if selecting today
          if (slot.toDateString() === now.toDateString() && slot <= now) {
            return false;
          }
          // Don't show booked slots
          const slotKey = slot.toISOString();
          return !bookedTimes.has(slotKey);
        })
        .map(slot => slot.toISOString());
      
      console.log(`Generated ${allSlots.length} total slots, ${availableSlots.length} available after filtering`);
      
      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }, []);

  // Refetch when doctorId changes
  useEffect(() => {
    if (doctorId) {
      fetchSchedules(doctorId);
    } else {
      setSchedules([]);
    }
  }, [doctorId, fetchSchedules]);

  return {
    schedules,
    loading,
    fetchSchedules,
    upsertSchedule,
    checkAvailability,
    getAvailableSlots,
  };
};
