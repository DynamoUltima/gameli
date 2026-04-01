import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DoctorCalendarViewProps {
  onClose: () => void;
  selectedDoctorId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doctorsData: any[];
}

export const DoctorCalendarView = ({ onClose, selectedDoctorId, doctorsData }: DoctorCalendarViewProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeDoctor, setActiveDoctor] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDoctorId && doctorsData && doctorsData.length > 0) {
      const doc = doctorsData.find(d => d.user_id === selectedDoctorId);
      if (doc) {
        setActiveDoctor(doc);
      } else {
        setActiveDoctor(doctorsData[0]);
      }
    } else if (doctorsData && doctorsData.length > 0 && !activeDoctor) {
      setActiveDoctor(doctorsData[0]);
    }
  }, [selectedDoctorId, doctorsData, activeDoctor]);

  const fetchAvailability = useCallback(async (doctorId: string) => {
    setLoadingAvailability(true);
    try {
      // Get start and end of the currently viewed month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);

      if (error) throw error;
      setAvailabilitySlots(data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error fetching schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAvailability(false);
    }
  }, [currentMonth, toast]);

  const fetchAppointments = useCallback(async (doctorId: string) => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      // Firestore doesn't support compound inequality filters across different fields
      // without a composite index. Fetch all pending/confirmed for this doctor and
      // filter by date range client-side.
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;

      // Client-side date range filter
      const filtered = (data || []).filter((apt: any) => {
        if (!apt.scheduled_at) return false;
        return apt.scheduled_at >= startOfMonth && apt.scheduled_at <= endOfMonth;
      });

      setAppointments(filtered);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
    }
  }, [currentMonth]);


  useEffect(() => {
    if (activeDoctor) {
      fetchAvailability(activeDoctor.user_id);
      fetchAppointments(activeDoctor.user_id);
    }
  }, [activeDoctor, fetchAvailability, fetchAppointments]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const filteredDoctors = doctorsData.filter(d => {
    const name = d.profiles?.full_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calendar Grid generation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0-6 (Sun-Sat)
  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const daysInPrevMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth() - 1);

  const calendarCells = [];

  // Previous month padding
  for (let i = startDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, daysInPrevMonth - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      isCurrentMonth: true
    });
  }

  // Next month padding to fill 6 rows (42 cells)
  const totalCells = calendarCells.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i),
      isCurrentMonth: false
    });
  }

  const getDateString = (date: Date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split('T')[0];
  };

  const getDayAvailability = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dateStr = getDateString(date);

    // Filter slots for this specific day
    const slots = availabilitySlots.filter(slot => 
      slot.date === dateStr || (!slot.date && slot.day_of_week === dayOfWeek)
    );

    if (slots.length === 0) return null;

    // Calculate total hours exactly as we did in AdminDashboard to determine "Partial" vs "Available"
    let totalMinutes = 0;
    slots.forEach(slot => {
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      totalMinutes += (endHour * 60 + endMin) - (startHour * 60 + startMin);
    });

    const hours = totalMinutes / 60;
    
    // Simplistic classification logic: >4 hours is Available, else Partial
    const type = hours > 4 ? "available" : "partial";

    // Just return the first slot for visual display or a summary string
    const sortedSlots = [...slots].sort((a,b) => a.start_time.localeCompare(b.start_time));
    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    const formatTimeStr = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    };

    const displayText = sortedSlots.length > 1 
      ? `${formatTimeStr(firstSlot.start_time)} - ${formatTimeStr(lastSlot.end_time)}`
      : `${formatTimeStr(firstSlot.start_time)} - ${formatTimeStr(firstSlot.end_time)}`;

    return { type, displayText };
  };

  const getDayAppointments = (date: Date) => {
    const dateStr = getDateString(date);
    
    // Filter appointments for this date and matching the active tab (if not 'all')
    const dayAppts = appointments.filter((apt) => {
      if (!apt.scheduled_at) return false;
      const aptDateStr = getDateString(new Date(apt.scheduled_at));
      if (aptDateStr !== dateStr) return false;
      
      const type = apt.type || apt.appointment_type || 'hospital';
      if (activeTab !== "all" && type !== activeTab) return false;
      
      return true;
    });

    // Count by type
    const counts = {
      online: 0,
      home: 0,
      hospital: 0,
    };
    
    dayAppts.forEach(apt => {
      const type = apt.type || apt.appointment_type || 'hospital';
      if (type === 'online') counts.online++;
      else if (type === 'home') counts.home++;
      else counts.hospital++;
    });

    return { counts, total: dayAppts.length };
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-[#171b24] border border-slate-700/60 rounded-2xl w-full h-full flex flex-col md:flex-row shadow-2xl relative overflow-hidden">
      
      <button 
        className="md:hidden absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e2432] text-slate-400 border border-slate-700 shadow-sm"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Left Sidebar */}
      <div className="w-full md:w-[320px] bg-[#12161f]/80 border-r border-slate-700/60 flex flex-col shrink-0 h-[40vh] md:h-full">
        <div className="p-5 border-b border-slate-700/60 bg-[#171b24]">
          <h3 className="text-xl font-semibold text-white tracking-tight mb-4">
            Doctor Availability
          </h3>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medical staff..." 
              className="w-full bg-[#1e2432] border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-base text-white placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 hide-scrollbar">
          {filteredDoctors.map((doc) => {
            const isActive = activeDoctor?.user_id === doc.user_id;
            const name = doc.profiles?.full_name || 'Unknown Doctor';
            const specialty = doc.specialties?.[0]?.name || 'General';
            const initials = getInitials(name);

            return (
              <button 
                key={doc.user_id}
                onClick={() => setActiveDoctor(doc)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-colors relative overflow-hidden group ${isActive ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-[#1e2432] border border-transparent hover:border-slate-700/50'}`}
              >
                {isActive && <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm shrink-0 transition-colors ${isActive ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-[#1e2432] border border-slate-700/60 text-slate-400 group-hover:text-slate-300'}`}>
                  {initials}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className={`text-base font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {name}
                  </div>
                  <div className={`text-sm truncate ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    {specialty}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-opacity ${isActive ? 'text-blue-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col bg-[#171b24] min-w-0 h-full">
        {/* Header */}
        <div className="p-5 md:px-8 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-[#171b24]">
          {activeDoctor && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-[#1e2432] border border-slate-700/60 items-center justify-center text-slate-200 font-semibold text-lg shrink-0 shadow-sm">
                {getInitials(activeDoctor.profiles?.full_name)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight leading-tight mb-0.5">
                  {activeDoctor.profiles?.full_name}'s Schedule
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${activeDoctor.available ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-500'}`}></span>
                  <span className="text-base text-slate-400">
                    {activeDoctor.available ? 'Accepting appointments' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#1e2432] rounded-xl border border-slate-700/50 p-1 shadow-sm">
              <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#12161f] transition-colors border border-transparent hover:border-slate-700/50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-semibold text-slate-200 px-4 min-w-[130px] text-center tracking-tight">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#12161f] transition-colors border border-transparent hover:border-slate-700/50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button onClick={onClose} className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#1e2432] border border-transparent hover:border-slate-700/50 transition-colors shadow-sm ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col bg-[#12161f]/30 hide-scrollbar h-full">
          {/* Tabs and Legend */}
          <div className="flex flex-col gap-4 mb-6 px-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="bg-[#1e2432] border border-slate-700/60 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-slate-700/60 data-[state=active]:text-white text-slate-400">All Visits</TabsTrigger>
                  <TabsTrigger value="online" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-slate-400">Online</TabsTrigger>
                  <TabsTrigger value="home" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400">Home</TabsTrigger>
                  <TabsTrigger value="hospital" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-slate-400">Hospital</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center">
                <Button variant="ghost" className="text-base font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4" />
                  Edit Template
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/40 text-[10px] text-blue-400 flex items-center justify-center font-bold">O</span>
                <span className="text-sm font-medium text-slate-300">Online</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-400 flex items-center justify-center font-bold">H</span>
                <span className="text-sm font-medium text-slate-300">Home</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-400 flex items-center justify-center font-bold">H</span>
                <span className="text-sm font-medium text-slate-300">Hospital</span>
              </div>
              <div className="h-4 w-px bg-slate-700/60 mx-2 hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></span>
                <span className="text-sm font-medium text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></span>
                <span className="text-sm font-medium text-slate-400">Partial Day</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col bg-slate-700/40 shadow-sm min-h-[500px]">
            <div className="grid grid-cols-7 bg-[#1e2432] shrink-0 border-b border-slate-700/60">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-slate-400 tracking-wide uppercase">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr flex-1 gap-px bg-slate-700/60">
              {calendarCells.map((cell, index) => {
                const isToday = getDateString(cell.date) === getDateString(new Date());
                const avail = getDayAvailability(cell.date);
                const dayAppts = cell.isCurrentMonth ? getDayAppointments(cell.date) : { counts: { online: 0, home: 0, hospital: 0 }, total: 0 };

                return (
                  <div 
                    key={index} 
                    className={`bg-[#171b24] p-2 sm:p-2.5 flex flex-col gap-1 min-h-[100px] transition-colors relative
                      ${!cell.isCurrentMonth ? 'opacity-40' : 'hover:bg-[#1e2432]/60 group cursor-pointer'}
                      ${isToday ? 'ring-inset ring-2 ring-blue-500 bg-blue-500/[0.02]' : ''}
                    `}
                  >
                    <div className={`flex items-center justify-between w-full mb-1`}>
                      <span className={`text-base font-medium transition-colors 
                        ${!cell.isCurrentMonth ? 'text-slate-500' : isToday ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'}
                      `}>
                        {cell.date.getDate()}
                      </span>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm leading-none shrink-0"></span>}
                    </div>
                    
                    {cell.isCurrentMonth && avail && (
                      <div className="flex flex-col gap-1 w-full opacity-60">
                        <div className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold tracking-wide truncate w-full text-center transition-colors
                          ${avail.type === 'available' 
                            ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/70 group-hover:bg-emerald-500/10' 
                            : 'bg-blue-500/5 border border-blue-500/10 text-blue-500/70 group-hover:bg-blue-500/10'
                          }
                        `}>
                          {avail.displayText}
                        </div>
                      </div>
                    )}
                    
                    {cell.isCurrentMonth && dayAppts.total > 0 && (
                      <div className="mt-auto flex flex-col gap-0.5 w-full pt-1">
                        {dayAppts.counts.online > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold text-center truncate shadow-sm">
                            {dayAppts.counts.online} Online
                          </div>
                        )}
                        {dayAppts.counts.home > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold text-center truncate shadow-sm">
                            {dayAppts.counts.home} Home
                          </div>
                        )}
                        {dayAppts.counts.hospital > 0 && (
                          <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold text-center truncate shadow-sm">
                            {dayAppts.counts.hospital} Hospital
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
