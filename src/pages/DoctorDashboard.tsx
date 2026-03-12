import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, Video, Users, DollarSign, Clock, Hospital, Bell, Settings, LogOut, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, UserPlus, Search, ChevronDown, FilePlus, Trash2, ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const { toast } = useToast();

  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("17:00");
  const [recurrence, setRecurrence] = useState("specific");
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Notes state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Pagination state for Today's Schedule
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5;

  // Pagination state for Calendar Appointments
  const [calendarCurrentPage, setCalendarCurrentPage] = useState(1);
  const calendarAppointmentsPerPage = 5;

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

      // Fetch doctor + specialties
      const { data: doctor } = await supabase
        .from("doctors")
        .select(`
          id,
          doctor_specialties (
            specialties (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (doctor?.doctor_specialties && doctor.doctor_specialties.length > 0) {
        const specs = doctor.doctor_specialties.map((ds: any) => ds.specialties?.name).filter(Boolean);
        setSpecialtyName(specs.join(', '));
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

  // Fetch availability slots
  useEffect(() => {
    if (!user?.id) return;
    const fetchAvailability = async () => {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id);
      
      if (error) {
        console.error('Error fetching availability:', error);
      } else {
        setAvailabilitySlots(data || []);
      }
    };
    fetchAvailability();
  }, [user?.id]);

  const handleAddSlot = async () => {
    if (!user?.id) return;
    setIsAddingSlot(true);
    
    // Check if end_time is after start_time
    if (newSlotEnd <= newSlotStart) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive"
      });
      setIsAddingSlot(false);
      return;
    }

    const startStr = `${newSlotStart}:00`;
    const endStr = `${newSlotEnd}:00`;

    let inserts: any[] = [];
    
    if (recurrence === "specific") {
      inserts.push({
        doctor_id: user.id,
        day_of_week: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        date: getDateString(selectedDate),
        start_time: startStr,
        end_time: endStr
      });
    } else if (recurrence === "week") {
      // Every day this week (Sun-Sat of the week containing selectedDate)
      const date = new Date(selectedDate);
      const day = date.getDay();
      const diff = date.getDate() - day; // Adjust to Sunday
      const startOfWeek = new Date(date.setDate(diff));
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        inserts.push({
          doctor_id: user.id,
          day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          date: getDateString(currentDate),
          start_time: startStr,
          end_time: endStr
        });
      }
    } else if (recurrence === "month_day") {
      // Every [Weekday] this month
      const targetDay = selectedDate.getDay();
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        if (currentDate.getDay() === targetDay) {
          inserts.push({
            doctor_id: user.id,
            day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            date: getDateString(currentDate),
            start_time: startStr,
            end_time: endStr
          });
        }
      }
    } else if (recurrence === "month_all") {
      // Every day this month
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        inserts.push({
          doctor_id: user.id,
          day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          date: getDateString(currentDate),
          start_time: startStr,
          end_time: endStr
        });
      }
    }

    const { data, error } = await supabase
      .from('doctor_availability')
      .insert(inserts)
      .select();

    if (error) {
      toast({
        title: "Error adding slot",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      setAvailabilitySlots(prev => [...prev, ...data]);
      toast({
        title: "Slot(s) added",
        description: "Your availability has been updated."
      });
    }
    setIsAddingSlot(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error removing slot",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setAvailabilitySlots(prev => prev.filter(slot => slot.id !== id));
      toast({
        title: "Slot removed",
        description: "Your availability has been updated."
      });
    }
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointmentId) {
      toast({ title: "Select an appointment", description: "Please select an active patient appointment first." });
      return;
    }
    
    setIsSavingNotes(true);
    const { error } = await supabase
      .from('appointments')
      .update({ notes: currentNotes })
      .eq('id', selectedAppointmentId);

    if (error) {
      toast({ title: "Error saving notes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes saved", description: "Clinical notes have been updated." });
      // Update local state so it shows up immediately in history
      setAllAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointmentId ? { ...apt, notes: currentNotes } : apt
      ));
    }
    setIsSavingNotes(false);
  };

  // Compute unique patients for the history table
  const patientHistory = useMemo(() => {
    const uniqueMap = new Map();
    allAppointments.forEach(apt => {
      if (apt.patient_id && apt.profiles) {
        const existing = uniqueMap.get(apt.patient_id);
        if (!existing || new Date(apt.scheduled_at) > new Date(existing.scheduled_at)) {
          uniqueMap.set(apt.patient_id, apt);
        }
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  }, [allAppointments]);

  // Handle dropdown change
  useEffect(() => {
    if (selectedAppointmentId) {
      const apt = allAppointments.find(a => a.id === selectedAppointmentId);
      setCurrentNotes(apt?.notes || "");
    } else {
      setCurrentNotes("");
    }
  }, [selectedAppointmentId, allAppointments]);

  // Set default selection for notes dropdown
  useEffect(() => {
    if (todayAppointments.length > 0 && !selectedAppointmentId) {
      setSelectedAppointmentId(todayAppointments[0].id);
    }
  }, [todayAppointments, selectedAppointmentId]);

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

  // Calculate pagination
  const totalPages = Math.ceil(todayAppointments.length / appointmentsPerPage);
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = todayAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  // Reset to page 1 when appointments change
  useEffect(() => {
    setCurrentPage(1);
  }, [todayAppointments.length]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
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

  // Calculate pagination for calendar appointments
  const calendarTotalPages = Math.ceil(selectedDateAppointments.length / calendarAppointmentsPerPage);
  const calendarIndexOfLastAppointment = calendarCurrentPage * calendarAppointmentsPerPage;
  const calendarIndexOfFirstAppointment = calendarIndexOfLastAppointment - calendarAppointmentsPerPage;
  const currentCalendarAppointments = selectedDateAppointments.slice(calendarIndexOfFirstAppointment, calendarIndexOfLastAppointment);

  // Reset calendar page when selected date changes
  useEffect(() => {
    setCalendarCurrentPage(1);
  }, [selectedDate, selectedDateAppointments.length]);

  const handleCalendarPreviousPage = () => {
    setCalendarCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleCalendarNextPage = () => {
    setCalendarCurrentPage((prev) => Math.min(prev + 1, calendarTotalPages));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="St. Gamaliel Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
            <span className="text-xl font-bold text-foreground">St. Gamaliel's Hospital</span>
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

      {/* Tabs */}
      <div className="border-b bg-card/95 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="container mx-auto px-4 flex items-center gap-8 h-12">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('patients')} 
            className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${activeTab === 'patients' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Patients
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard View Content */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
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
                  <h3 className="text-3xl font-bold text-success">GHS 4,250</h3>
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
                            <div className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold shadow-md ${isSelected
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
                      <div className="flex items-center gap-3">
                        {selectedDateAppointments.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {selectedDateAppointments.length > calendarAppointmentsPerPage && (
                          <span className="text-xs text-muted-foreground">
                            Page {calendarCurrentPage} of {calendarTotalPages}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedDateAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {currentCalendarAppointments.map((apt: any) => {
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

                        {selectedDateAppointments.length > calendarAppointmentsPerPage && (
                          <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCalendarPreviousPage}
                              disabled={calendarCurrentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Showing {calendarIndexOfFirstAppointment + 1}-{Math.min(calendarIndexOfLastAppointment, selectedDateAppointments.length)} of {selectedDateAppointments.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCalendarNextPage}
                              disabled={calendarCurrentPage === calendarTotalPages}
                            >
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>Your appointments for today</CardDescription>
                  </div>
                  {todayAppointments.length > appointmentsPerPage && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    <>
                      {currentAppointments.map((apt) => (
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

                      {todayAppointments.length > appointmentsPerPage && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Showing {indexOfFirstAppointment + 1}-{Math.min(indexOfLastAppointment, todayAppointments.length)} of {todayAppointments.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
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
            {/* Manage Availability */}
            <Card className="flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Manage Availability</CardTitle>
                <CardDescription>Select a date to set open slots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Mini Calendar */}
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-semibold">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Mini calendar days */}
                    {(isMonthExpanded ? Array.from({length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()}, (_, i) => i + 1) : [selectedDate.getDate(), selectedDate.getDate()+1, selectedDate.getDate()+2, selectedDate.getDate()+3, selectedDate.getDate()+4, selectedDate.getDate()+5, selectedDate.getDate()+6]).map((day, i) => {
                      // Adjust dummy sliding window for the mini view when not expanded
                      const displayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isSelected = displayDate.toDateString() === selectedDate.toDateString();
                      const displayDateStr = getDateString(displayDate);
                      const displayDayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const hasAvailability = availabilitySlots.some(slot => 
                        slot.date === displayDateStr || (!slot.date && slot.day_of_week === displayDayName)
                      );
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => setSelectedDate(displayDate)}
                          className={`aspect-square flex flex-col justify-center items-center gap-[2px] text-xs font-medium rounded cursor-pointer transition-colors ${isSelected ? 'text-primary-foreground bg-primary shadow-sm' : hasAvailability ? 'text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                          <span>{displayDate.getDate()}</span>
                          {hasAvailability && (
                            <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`}></span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 text-center">
                    <button 
                      onClick={() => setIsMonthExpanded(!isMonthExpanded)} 
                      className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {isMonthExpanded ? "Show current week" : "Show full month"}
                    </button>
                  </div>
                </div>

                {/* Available Slots */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Available Slots ({selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </label>
                  
                  {availabilitySlots
                    .filter(slot => slot.date === getDateString(selectedDate) || (!slot.date && slot.day_of_week === selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()))
                    .sort((a,b) => a.start_time.localeCompare(b.start_time))
                    .map((slot, index) => (
                    <div key={slot.id || index} className="group flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border hover:border-muted-foreground/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatTimeStr(slot.start_time)} - {formatTimeStr(slot.end_time)}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {availabilitySlots.filter(slot => slot.date === getDateString(selectedDate) || (!slot.date && slot.day_of_week === selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())).length === 0 && (
                    <div className="text-center py-4 bg-muted/10 rounded-lg border border-border text-xs text-muted-foreground">
                      No availability set for this day.
                    </div>
                  )}
                </div>

                {/* Add Time Slot */}
                <div className="space-y-3 mt-auto border-t pt-4">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Add Time Slot &amp; Recurrence
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full">
                      <select 
                        className="w-full bg-background border border-input rounded-lg pl-3 pr-7 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none"
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                      >
                        <option value="specific">Specific Date ({selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</option>
                        <option value="week">Every day this Week</option>
                        <option value="month_day">Every {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} this Month</option>
                        <option value="month_all">Every day this Month</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="flex flex-col xl:flex-row items-center gap-2">
                      <div className="flex-1 relative w-full">
                        <input 
                          type="time" 
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                        />
                      </div>
                      <span className="text-muted-foreground hidden xl:block text-xs">to</span>
                      <div className="flex-1 relative w-full">
                        <input 
                          type="time" 
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleAddSlot}
                        disabled={isAddingSlot}
                        className="w-full xl:w-auto px-4 shadow-sm shrink-0"
                      >
                        {isAddingSlot ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <span className="font-semibold">GHS 4,250</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Week:</span>
                    <span className="font-semibold">GHS 18,900</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Month:</span>
                    <span className="font-semibold text-primary">GHS 72,450</span>
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
        )}

        {/* Patients View Content */}
        {activeTab === 'patients' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
                Patient Management
              </h1>
              <p className="text-base text-muted-foreground">
                View patient history, manage records, and update clinical notes
              </p>
            </div>

            {!selectedPatient ? (
              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Patient History */}
                <Card className="lg:col-span-2 flex flex-col h-full bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                  <CardTitle className="text-xl">Patient History</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search patients..." 
                      className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-y border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                          <th className="py-3 px-4 font-medium">Patient Name</th>
                          <th className="py-3 px-4 font-medium">Last Visit</th>
                          <th className="py-3 px-4 font-medium">Diagnosis / Reason</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-border/30">
                        {patientHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">No patients found</td>
                          </tr>
                        ) : (
                          patientHistory.map((apt: any) => (
                            <tr key={apt.patient_id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4 font-medium text-foreground">{apt.profiles?.full_name}</td>
                              <td className="py-4 px-4 text-muted-foreground">
                                {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-4 px-4 text-muted-foreground truncate max-w-[200px]">
                                {apt.notes || "No recent notes"}
                              </td>
                              <td className="py-4 px-4">
                                <Badge variant="outline" className={
                                  apt.status === 'completed' ? "text-green-600 bg-green-500/10 border-green-500/20" :
                                  apt.status === 'pending' || apt.status === 'scheduled' ? "text-blue-600 bg-blue-500/10 border-blue-500/20" :
                                  apt.status === 'confirmed' ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" :
                                  "text-gray-600 bg-gray-500/10 border-gray-500/20"
                                }>
                                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Button variant="link" size="sm" className="text-primary p-0" onClick={() => setSelectedPatient(apt.patient_id)}>
                                  View Profile
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Notes */}
              <Card className="flex flex-col h-full bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Clinical Notes</CardTitle>
                  <CardDescription>Record observations for current patient</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 flex-1 flex flex-col pt-0">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground">Select Active Patient</label>
                    <div className="relative">
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={selectedAppointmentId}
                        onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      >
                        <option value="">-- Select Appointment --</option>
                        {todayAppointments.map((apt: any) => (
                          <option key={apt.id} value={apt.id}>{apt.patient} ({apt.time})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="block text-xs font-medium text-muted-foreground">Consultation Notes</label>
                    <textarea 
                      className="flex min-h-[180px] w-full flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed"
                      placeholder="Enter patient symptoms, diagnosis, and treatment plan..."
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                    ></textarea>
                  </div>
                  <Button 
                    className="w-full mt-auto gap-2" 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || !selectedAppointmentId}
                  >
                    <FilePlus className="w-5 h-5" />
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            ) : (() => {
              const selectedProfile = patientHistory.find(p => p.patient_id === selectedPatient)?.profiles;
              const patientName = selectedProfile?.full_name || "Unknown Patient";
              const patientInitials = patientName.split(' ').map((n:any)=>n[0]).join('').substring(0,2).toUpperCase();
              const profileAppointments = allAppointments.filter(apt => apt.patient_id === selectedPatient).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
              
              return (
              <div className="flex flex-col gap-6 lg:gap-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setSelectedPatient(null)} className="h-10 w-10 shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
                      {patientName}
                    </h2>
                    <p className="text-sm font-normal text-muted-foreground">
                      Patient Profile & Clinical History
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
                  <div className="flex flex-col gap-6">
                    <Card className="flex flex-col items-center p-6 bg-card/80 backdrop-blur-sm border-border/50 text-center">
                      <Avatar className="h-24 w-24 mb-5 border-2 border-primary/20 p-1">
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                          {patientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {patientName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">Patient ID: #{selectedPatient?.substring(0, 8)}</p>

                      <div className="w-full space-y-4 text-left">
                        <div className="flex justify-between border-b pb-3">
                          <span className="text-sm text-muted-foreground">Phone</span>
                          <span className="text-sm font-medium text-foreground">{selectedProfile?.phone || "N/A"}</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="xl:col-span-2 flex flex-col gap-6">
                    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                      <h2 className="text-xl font-semibold tracking-tight text-foreground mb-8">
                        Clinical Notes History
                      </h2>

                      <div className="space-y-0">
                        {profileAppointments.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">No clinical history found</div>
                        ) : (
                          profileAppointments.map((apt, index) => (
                            <div key={apt.id} className={`relative pl-6 border-l-2 ${index === profileAppointments.length - 1 ? 'border-transparent pb-2' : 'border-border pb-8'}`}>
                              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'} ring-4 ring-background`}></div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <div>
                                  <h4 className="text-base font-semibold text-foreground">
                                    {apt.symptoms ? 'Consultation' : 'Routine Checkup'}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {apt.type === 'online' ? 'Online Consultation' : apt.type === 'home' ? 'Home Visit' : 'Hospital Visit'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="font-medium bg-background shadow-sm">
                                  {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Badge>
                              </div>
                              <div className="bg-muted/30 rounded-xl p-4 sm:p-5 border border-border text-sm text-foreground/80 leading-relaxed">
                                {apt.notes || (apt.symptoms ? `Symptoms reported: ${apt.symptoms}` : "No comprehensive clinical notes recorded for this visit.")}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
