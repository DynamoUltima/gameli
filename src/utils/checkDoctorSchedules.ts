import { supabase } from '@/integrations/supabase/client';

export const checkDoctorSchedules = async () => {
  try {
    // Get all doctor schedules with doctor and profile information
    const { data, error } = await supabase.rpc('get_doctor_schedules_with_details');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { message: 'No doctor schedules found in the database', schedules: [] };
    }

    // Group schedules by doctor
    const doctorsMap = new Map();
    
    data.forEach(item => {
      if (!doctorsMap.has(item.doctor_id)) {
        doctorsMap.set(item.doctor_id, {
          id: item.doctor_id,
          name: item.doctor_name || 'Unknown',
          email: item.doctor_email || 'No email',
          schedules: []
        });
      }
      
      if (item.schedule_id) {
        doctorsMap.get(item.doctor_id).schedules.push({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.day_of_week] || `Day ${item.day_of_week}`,
          start_time: item.start_time,
          end_time: item.end_time,
          is_available: item.is_available
        });
      }
    });

    const doctorsWithSchedules = Array.from(doctorsMap.values());
    
    return {
      totalDoctors: doctorsWithSchedules.length,
      totalSchedules: data.reduce((acc, curr) => curr.schedule_id ? acc + 1 : acc, 0),
      doctors: doctorsWithSchedules
    };
  } catch (error) {
    console.error('Error checking doctor schedules:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error',
      schedules: [] 
    };
  }
};
