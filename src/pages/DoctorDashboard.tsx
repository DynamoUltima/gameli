import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, Video, Users, DollarSign, Clock, Hospital, Bell, Settings, LogOut, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, UserPlus } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'new_appointment' | 'confirmed' | 'cancelled' | 'completed';
  message: string;
  time: string;
  appointment: any;
}

const DoctorDashboard = () => {
  const { user, signOut } = useAuth(true);

  const [fullName, setFullName] = useState<string>("");
  const [specialtyName, setSpecialtyName] = useState<string>("");
  const [todayAppointments, setTodayAppointments] = useState<Array<{
    id: string;
    patient: string;
    time: string;
    type: "online" | "hospital" | "home";
  }>>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!user?.id) return;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setFullName(profile?.full_name ?? "");

      // Fetch doctor + specialty
      const { data: doctor } = await supabase
        .from("doctors")
        .select("specialty_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (doctor?.specialty_id) {
        const { data: specialty } = await supabase
          .from("specialties")
          .select("name")
          .eq("id", doctor.specialty_id)
          .maybeSingle();
        setSpecialtyName(specialty?.name ?? "");
      } else {
        setSpecialtyName("");
      }
    };

    loadDoctor();
  }, [user?.id]);

  // Fetch all appointments for calendar view
  useEffect(() => {
    const loadAllAppointments = async () => {
      if (!user?.id) return;

      // Get doctor record
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!doctorData) {
        console.log('No doctor record found for user:', user.id);
        return;
      }

      console.log('Fetching appointments for doctor user_id:', user.id);

      // Fetch ALL appointments for this doctor (no date filter, no status filter)
      // This ensures appointments show up in the calendar regardless of which month is viewed
      // Note: doctor_id in appointments table references auth.users.id directly, not doctors.id
      // Note: patient_id also references auth.users.id, so we need to fetch profiles separately
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          specialties (
            id,
            name
          )
        `)
        .eq('doctor_id', user.id)
        // No status filter - include ALL statuses (pending, confirmed, completed, cancelled)
        // No date filter - include ALL dates so calendar works for any month
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      // Fetch patient profiles separately since appointments.patient_id references auth.users.id
      // and profiles.id also references auth.users.id (they share the same ID)
      const patientIds = appointments ? Array.from(new Set(appointments.map((apt: any) => apt.patient_id).filter(Boolean))) : [];
      let patientProfilesMap = new Map();

      if (patientIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', patientIds);

        if (profilesError) {
          console.error('Error fetching patient profiles:', profilesError);
        } else if (profiles) {
          profiles.forEach((profile: any) => {
            patientProfilesMap.set(profile.id, profile);
          });
        }
      }

      // Combine appointments with patient profiles
      const appointmentsWithProfiles = appointments?.map((apt: any) => ({
        ...apt,
        profiles: patientProfilesMap.get(apt.patient_id) || null
      })) || [];

      console.log('=== Fetched all appointments with relations ===');
      console.log('Total appointments (all statuses, all dates):', appointmentsWithProfiles.length);

      // Log each appointment with full details
      if (appointmentsWithProfiles.length > 0) {
        appointmentsWithProfiles.forEach((apt: any, index: number) => {
          console.log(`Appointment ${index + 1}:`, {
            id: apt.id,
            patient_id: apt.patient_id,
            patient_name: apt.profiles?.full_name || 'Unknown',
            patient_phone: apt.profiles?.phone || 'N/A',
            doctor_id: apt.doctor_id,
            specialty: apt.specialties?.name || apt.clinic || 'N/A',
            type: apt.type,
            scheduled_at: apt.scheduled_at,
            scheduled_at_string: getDateString(apt.scheduled_at),
            status: apt.status,
            symptoms: apt.symptoms,
            location: apt.location,
            payment_status: apt.payment_status,
            created_at: apt.created_at
          });
        });
      } else {
        console.log('No appointments found for this doctor.');
      }
      
      setAllAppointments(appointmentsWithProfiles);
      console.log(`📅 Total appointments loaded for calendar: ${appointmentsWithProfiles.length} (all statuses, all dates)`);

      // Also set today's appointments using date string comparison
      const today = new Date();
      const todayDateStr = getDateString(today);

      const todayAppts = appointmentsWithProfiles.filter((apt: any) => {
        if (!apt.scheduled_at) return false;
        const aptDateStr = getDateString(apt.scheduled_at);
        return aptDateStr === todayDateStr;
      });

      console.log("Today's appointments:", todayAppts.length);

      setTodayAppointments(todayAppts.map((apt: any) => {
        const scheduledDate = new Date(apt.scheduled_at);
        return {
          id: apt.id,
          patient: apt.profiles?.full_name || "Patient",
          time: scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: apt.type || 'hospital',
        };
      }));
    };

    loadAllAppointments();
  }, [user?.id, currentMonth]);

  // Fetch recent activities/notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        // Get appointments from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentAppointments, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich and convert to notifications
        const recentNotifications = await Promise.all(
          (recentAppointments || []).map(async (apt) => {
            // Fetch patient profile
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.patient_id)
              .single();

            const patientName = patientProfile?.full_name || 'Patient';
            const date = new Date(apt.scheduled_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const time = new Date(apt.scheduled_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            let message = '';
            let type: 'new_appointment' | 'confirmed' | 'cancelled' | 'completed' = 'new_appointment';

            switch (apt.status) {
              case 'pending':
                message = `New appointment request from ${patientName} for ${date} at ${time}`;
                type = 'new_appointment';
                break;
              case 'confirmed':
                message = `Appointment with ${patientName} confirmed for ${date} at ${time}`;
                type = 'confirmed';
                break;
              case 'cancelled':
                message = `Appointment with ${patientName} on ${date} was cancelled`;
                type = 'cancelled';
                break;
              case 'completed':
                message = `Appointment with ${patientName} on ${date} completed`;
                type = 'completed';
                break;
              default:
                message = `Appointment update with ${patientName}`;
            }

            return {
              id: apt.id,
              type,
              message,
              time: apt.created_at,
              appointment: apt
            };
          })
        );

        setNotifications(recentNotifications);
        // Count pending appointments as unread
        const unread = recentNotifications.filter(n => n.type === 'new_appointment').length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Format relative time for notifications
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return <UserPlus className="w-5 h-5 text-primary" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const initials = useMemo(() => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName]);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Helper function to get date string in YYYY-MM-DD format (ignores time and timezone)
  const getDateString = (date: Date | string): string => {
    if (typeof date === 'string') {
      // If it's an ISO string, extract just the date part (YYYY-MM-DD)
      return date.split('T')[0];
    } else {
      // If it's a Date object, format it as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const targetDateStr = getDateString(date);
    
    const matches = allAppointments.filter((apt: any) => {
      if (!apt.scheduled_at) {
        console.warn('Appointment missing scheduled_at:', apt.id);
        return false;
      }
      
      // Get date string from appointment's scheduled_at (YYYY-MM-DD format)
      const aptDateStr = getDateString(apt.scheduled_at);
      
      // Compare date strings directly - include ALL statuses (pending, confirmed, completed, cancelled)
      const match = aptDateStr === targetDateStr;
      
      if (match) {
        console.log(`✅ Found appointment match for ${targetDateStr}:`, {
          apt_id: apt.id,
          apt_scheduled_at: apt.scheduled_at,
          apt_date_str: aptDateStr,
          apt_status: apt.status,
          target_date_str: targetDateStr
        });
      }
      
      return match;
    });
    
    // Sort appointments by time (scheduled_at)
    matches.sort((a: any, b: any) => {
      const timeA = new Date(a.scheduled_at).getTime();
      const timeB = new Date(b.scheduled_at).getTime();
      return timeA - timeB;
    });
    
    if (matches.length > 0) {
      console.log(`Found ${matches.length} appointment(s) for ${targetDateStr} (all statuses)`);
    }
    
    return matches;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Hospital className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Gameli's Hospital</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Recent appointment activities
                  </p>
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(notification.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setUnreadCount(0);
                      }}
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">{initials || "DR"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{`Welcome back, ${fullName ? `Dr. ${fullName}` : "Doctor"}!`}</h1>
          <p className="text-muted-foreground">{specialtyName || ""}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <h3 className="text-3xl font-bold text-primary">{todayAppointments.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
                  <h3 className="text-3xl font-bold text-accent">{allAppointments.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <h3 className="text-3xl font-bold text-success">$4,250</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <h3 className="text-3xl font-bold text-warning">
                    {allAppointments.filter((apt: any) => apt.status === 'scheduled' || apt.status === 'confirmed').length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Appointments Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[120px] text-center">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                      <div key={`empty-${index}`} className="p-2" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const date = new Date(year, month, day);
                      const dayAppointments = getAppointmentsForDate(date);
                      const hasAppointments = dayAppointments.length > 0;
                      const appointmentCount = dayAppointments.length;
                      const isTodayDate = isToday(date);
                      const isSelected = isSelectedDate(date);
                      
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            relative p-2 text-sm rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md min-h-[3rem] flex flex-col items-center justify-center
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground border-primary shadow-lg' 
                              : isTodayDate
                              ? 'bg-primary/20 border-primary font-bold'
                              : hasAppointments
                              ? 'bg-accent/20 border-accent/60 hover:border-accent font-medium shadow-sm'
                              : 'border-border hover:border-primary/50 bg-background'
                            }
                          `}
                        >
                          <div className="text-center font-semibold">{day}</div>
                          {hasAppointments && (
                            <div className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold shadow-md ${
                              isSelected 
                                ? 'bg-primary-foreground text-primary' 
                                : 'bg-accent text-accent-foreground'
                            }`}>
                              {appointmentCount > 99 ? '99+' : appointmentCount}
                            </div>
                          )}
                          {hasAppointments && !isSelected && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                              {dayAppointments.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent" />
                              ))}
                              {appointmentCount > 3 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Date Appointments */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h4>
                      {selectedDateAppointments.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {selectedDateAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateAppointments.map((apt: any) => {
                          const scheduledDate = new Date(apt.scheduled_at);
                          // Determine status badge variant
                          const getStatusVariant = (status: string) => {
                            switch (status?.toLowerCase()) {
                              case 'confirmed':
                                return 'default';
                              case 'completed':
                                return 'secondary';
                              case 'cancelled':
                                return 'destructive';
                              case 'pending':
                              default:
                                return 'outline';
                            }
                          };
                          
                          // Determine status color for border/background (more subtle, muted colors)
                          const getStatusColor = (status: string) => {
                            switch (status?.toLowerCase()) {
                              case 'confirmed':
                                return 'border-l-4 border-l-green-600/40 bg-muted/30 dark:bg-muted/20';
                              case 'completed':
                                return 'border-l-4 border-l-slate-400/40 bg-muted/20 dark:bg-muted/10';
                              case 'cancelled':
                                return 'border-l-4 border-l-red-500/40 bg-muted/30 dark:bg-muted/20';
                              case 'pending':
                              default:
                                return 'border-l-4 border-l-amber-500/40 bg-muted/30 dark:bg-muted/20';
                            }
                          };

                          return (
                            <div 
                              key={apt.id} 
                              className={`flex items-center justify-between p-3 border border-border/50 rounded-lg transition-all hover:shadow-sm hover:border-border ${getStatusColor(apt.status || 'pending')}`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {apt.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'PT'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{apt.profiles?.full_name || 'Patient'}</p>
                                    <Badge 
                                      variant={getStatusVariant(apt.status || 'pending')}
                                      className="text-xs"
                                    >
                                      {apt.status || 'pending'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <Badge variant={apt.type === "online" ? "default" : "secondary"} className="text-xs">
                                      {apt.type || 'hospital'}
                                    </Badge>
                                    {apt.specialties?.name && (
                                      <span className="text-xs text-muted-foreground">
                                        {apt.specialties.name}
                                      </span>
                                    )}
                                  </div>
                                  {apt.symptoms && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {apt.symptoms}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {apt.type === "online" && apt.status !== 'cancelled' && (
                                  <Button size="sm" variant="outline" title="Start video call">
                                    <Video className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your appointments for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 items-center flex-1">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {apt.patient.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{apt.patient}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {apt.time}
                              </div>
                              <Badge variant={apt.type === "online" ? "default" : "secondary"}>
                                {apt.type === "online" ? "Online" : "In-Person"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {apt.type === "online" && (
                          <Button size="sm">
                            <Video className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>Manage your schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                    <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{day}</span>
                      <span className="text-sm text-muted-foreground">09:00 AM - 05:00 PM</span>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Doctor Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4">
                  <Avatar className="h-20 w-20 mx-auto mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials || "DR"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{fullName ? `Dr. ${fullName}` : "Doctor"}</h3>
                  <p className="text-sm text-muted-foreground">{specialtyName || ""}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">15 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="font-medium">4.9/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patients:</span>
                    <span className="font-medium">3,897</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Today:</span>
                    <span className="font-semibold">$4,250</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Week:</span>
                    <span className="font-semibold">$18,900</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Month:</span>
                    <span className="font-semibold text-primary">$72,450</span>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            <Button variant="destructive" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
