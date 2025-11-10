import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Schedule {
  day: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface DoctorSchedule {
  id: string;
  name: string;
  email: string;
  schedules: Schedule[];
}

export default function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, get all doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, user_id')
        .eq('available', true);

      if (doctorsError) throw doctorsError;
      
      if (!doctorsData || doctorsData.length === 0) {
        setSchedules([]);
        return;
      }

      // Get all profiles for these doctors
      const userIds = doctorsData.map(d => d.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Get all schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .order('doctor_id')
        .order('day_of_week');

      if (schedulesError) throw schedulesError;

      // Combine the data
      const doctorsWithSchedules = doctorsData.map(doctor => {
        const profile = profileMap.get(doctor.user_id);
        return {
          id: doctor.id,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || 'No email',
          schedules: (schedulesData || [])
            .filter(schedule => schedule.doctor_id === doctor.id)
            .map(schedule => ({
              day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.day_of_week] || `Day ${schedule.day_of_week}`,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_available: schedule.is_available
            }))
        };
      });

      setSchedules(doctorsWithSchedules);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Doctor Schedules</h1>
        <p>Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Doctor Schedules</h1>
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button onClick={fetchSchedules}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Doctor Schedules</h1>
      
      {schedules.length === 0 ? (
        <p>No doctor schedules found.</p>
      ) : (
        <div className="space-y-6">
          {schedules.map(doctor => (
            <Card key={doctor.id}>
              <CardHeader>
                <CardTitle>{doctor.name}</CardTitle>
                <p className="text-sm text-gray-500">{doctor.email}</p>
              </CardHeader>
              <CardContent>
                {doctor.schedules.length === 0 ? (
                  <p>No schedule available</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctor.schedules.map((schedule, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{schedule.day}</TableCell>
                          <TableCell>{schedule.start_time}</TableCell>
                          <TableCell>{schedule.end_time}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              schedule.is_available 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {schedule.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
