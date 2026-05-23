import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Trash2, ChevronDown, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ManageDoctorAvailabilityProps {
  doctorId: string;
}

export const ManageDoctorAvailability: React.FC<ManageDoctorAvailabilityProps> = ({ doctorId }) => {
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availMonth, setAvailMonth] = useState(new Date());
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("17:00");
  const [newSlotType, setNewSlotType] = useState<"hospital" | "online" | "home">("hospital");
  const [recurrence, setRecurrence] = useState("specific");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);
  const { toast } = useToast();

  const getDateString = (date: Date) => {
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().split('T')[0];
  };

  const formatTimeStr = (timeStr: string) => timeStr.substring(0, 5);

  useEffect(() => {
    if (!doctorId) return;
    const fetchAvailability = async () => {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);
      
      if (error) {
        console.error('Error fetching availability:', error);
      } else {
        setAvailabilitySlots(data || []);
      }
    };
    fetchAvailability();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId);
      
      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        setAllAppointments(data || []);
      }
    };
    fetchAppointments();
  }, [doctorId]);

  const handleAddSlot = async () => {
    if (!doctorId) return;
    setIsAddingSlot(true);
    setSlotConflict(null);
    
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
        doctor_id: doctorId,
        day_of_week: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        date: getDateString(selectedDate),
        start_time: startStr,
        end_time: endStr,
        visit_type: newSlotType
      });
    } else if (recurrence === "week") {
      const date = new Date(selectedDate);
      const day = date.getDay();
      const diff = date.getDate() - day;
      const startOfWeek = new Date(date.setDate(diff));
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        inserts.push({
          doctor_id: doctorId,
          day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          date: getDateString(currentDate),
          start_time: startStr,
          end_time: endStr,
          visit_type: newSlotType
        });
      }
    } else if (recurrence === "month_day") {
      const targetDay = selectedDate.getDay();
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        if (currentDate.getDay() === targetDay) {
          inserts.push({
            doctor_id: doctorId,
            day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            date: getDateString(currentDate),
            start_time: startStr,
            end_time: endStr,
            visit_type: newSlotType
          });
        }
      }
    } else if (recurrence === "month_all") {
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        inserts.push({
          doctor_id: doctorId,
          day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          date: getDateString(currentDate),
          start_time: startStr,
          end_time: endStr,
          visit_type: newSlotType
        });
      }
    }

    const conflicts: string[] = [];
    for (const newSlot of inserts) {
      const existingSlotsForDay = availabilitySlots.filter(existing =>
        existing.date === newSlot.date || 
        (!existing.date && !newSlot.date && existing.day_of_week === newSlot.day_of_week)
      );

      for (const existing of existingSlotsForDay) {
        if (!existing.start_time || !existing.end_time) continue;
        
        const existStart = existing.start_time.substring(0, 5);
        const existEnd = existing.end_time.substring(0, 5);
        const newStart = newSlot.start_time.substring(0, 5);
        const newEnd = newSlot.end_time.substring(0, 5);

        if (newStart < existEnd && existStart < newEnd) {
          const dayLabel = newSlot.date || newSlot.day_of_week;
          conflicts.push(`${dayLabel}: ${formatTimeStr(existing.start_time)} – ${formatTimeStr(existing.end_time)}`);
        }
      }
    }

    if (conflicts.length > 0) {
      const uniqueConflicts = [...new Set(conflicts)];
      toast({
        title: "Conflicting time slots",
        description: `The new slot overlaps with existing availability:\n${uniqueConflicts.slice(0, 3).join(', ')}${uniqueConflicts.length > 3 ? ` and ${uniqueConflicts.length - 3} more` : ''}`,
        variant: "destructive"
      });
      setIsAddingSlot(false);
      return;
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
        description: "Availability has been updated."
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
        description: "Availability has been updated."
      });
    }
  };

  return (
    <div className="flex flex-col relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 h-full">
      <div className="space-y-5 flex flex-col h-full overflow-y-auto hide-scrollbar p-6">
        {/* Mini Calendar */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (isMonthExpanded) {
                  setAvailMonth(new Date(availMonth.getFullYear(), availMonth.getMonth() - 1, 1));
                } else {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 7);
                  setSelectedDate(prev);
                  setAvailMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
                }
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold">
              {availMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (isMonthExpanded) {
                  setAvailMonth(new Date(availMonth.getFullYear(), availMonth.getMonth() + 1, 1));
                } else {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 7);
                  setSelectedDate(next);
                  setAvailMonth(new Date(next.getFullYear(), next.getMonth(), 1));
                }
              }}
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
            {(() => {
              let daysToRender: number[];
              if (isMonthExpanded) {
                // All days in the current month
                const totalDays = new Date(availMonth.getFullYear(), availMonth.getMonth() + 1, 0).getDate();
                daysToRender = Array.from({ length: totalDays }, (_, i) => i + 1);
              } else {
                // 7 days of the current week (Sun – Sat) based on selectedDate
                const refDate = new Date(selectedDate);
                const sunday = new Date(refDate);
                sunday.setDate(refDate.getDate() - refDate.getDay());
                daysToRender = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(sunday);
                  d.setDate(sunday.getDate() + i);
                  return d.getDate();
                });
              }
              return daysToRender;
            })().map((day, i) => {
              const displayDate = new Date(availMonth.getFullYear(), availMonth.getMonth(), day);
              const isSelected = displayDate.toDateString() === selectedDate.toDateString();
              const displayDateStr = getDateString(displayDate);
              const displayDayName = displayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              const slotsForDay = availabilitySlots.filter(slot => 
                slot.date === displayDateStr || (!slot.date && slot.day_of_week === displayDayName)
              );
              const hasAvailability = slotsForDay.length > 0;
              const uniqueVisitTypes = Array.from(new Set(slotsForDay.map(s => s.visit_type || 'hospital')));
              
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(displayDate)}
                  className={`aspect-square flex flex-col justify-center items-center gap-[2px] text-xs font-medium rounded cursor-pointer transition-colors ${isSelected ? 'text-primary-foreground bg-primary shadow-sm' : hasAvailability ? 'text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <span>{displayDate.getDate()}</span>
                  {hasAvailability && (
                    <div className="flex gap-[2px]">
                      {uniqueVisitTypes.map((vType, idx) => {
                        let dotColor = 'bg-primary';
                        if (vType === 'online') dotColor = isSelected ? 'bg-amber-300' : 'bg-amber-500';
                        else if (vType === 'home') dotColor = isSelected ? 'bg-emerald-300' : 'bg-emerald-500';
                        else dotColor = isSelected ? 'bg-primary-foreground/90' : 'bg-primary';
                        return <span key={idx} className={`w-1 h-1 rounded-full ${dotColor}`}></span>;
                      })}
                    </div>
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
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span>Hospital</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Online</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Home</div>
            </div>
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
            .map((slot, index) => {
              const slotDate = slot.date || getDateString(selectedDate);
              const isBooked = allAppointments.some(appt => {
                if (appt.status === 'cancelled') return false;
                if (!appt.scheduled_at) return false;
                
                const apptDate = format(new Date(appt.scheduled_at), 'yyyy-MM-dd');
                if (apptDate !== slotDate) return false;
                
                if (!slot.start_time || !slot.end_time) return false;
                
                const apptTime = format(new Date(appt.scheduled_at), 'HH:mm');
                const slotStart = slot.start_time.substring(0, 5);
                const slotEnd = slot.end_time.substring(0, 5);
                
                return apptTime >= slotStart && apptTime < slotEnd;
              });

              return (
                <div key={slot.id || index} className="group flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border hover:border-muted-foreground/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatTimeStr(slot.start_time)} - {formatTimeStr(slot.end_time)}</span>
                    {slot.visit_type && (
                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium capitalize ml-1 border ${
                        slot.visit_type === 'online' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                        slot.visit_type === 'home' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {slot.visit_type === 'home' ? 'Home Visit' : slot.visit_type}
                      </span>
                    )}
                    {isBooked && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Booked
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="h-8 w-8 hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          
          {availabilitySlots.filter(slot => slot.date === getDateString(selectedDate) || (!slot.date && slot.day_of_week === selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())).length === 0 && (
            <div className="text-center py-4 bg-muted/10 rounded-lg border border-border text-xs text-muted-foreground">
              No availability set for this day.
            </div>
          )}
        </div>

        {/* Add Time Slot */}
        <div className="space-y-3 mt-auto pt-4 shrink-0">
          <label className="block text-xs font-medium text-muted-foreground">
            Add Time Slot &amp; Recurrence
          </label>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <select 
                  className="w-full bg-background border border-input rounded-lg pl-3 pr-7 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer appearance-none"
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value as "hospital" | "online" | "home")}
                >
                  <option value="hospital">Hospital Visit</option>
                  <option value="online">Online Consult</option>
                  <option value="home">Home Visit</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative flex-[2]">
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
            </div>
            <div className="flex flex-col xl:flex-row items-center gap-2">
              <div className="flex-1 relative w-full">
                <input 
                  type="time" 
                  value={newSlotStart}
                  onChange={(e) => setNewSlotStart(e.target.value)}
                  className={`w-full bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer ${slotConflict ? 'border-destructive' : 'border-input'}`}
                />
              </div>
              <span className="text-muted-foreground hidden xl:block text-xs">to</span>
              <div className="flex-1 relative w-full">
                <input 
                  type="time" 
                  value={newSlotEnd}
                  onChange={(e) => setNewSlotEnd(e.target.value)}
                  className={`w-full bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer ${slotConflict ? 'border-destructive' : 'border-input'}`}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleAddSlot}
                disabled={isAddingSlot || !!slotConflict || newSlotEnd <= newSlotStart}
                className="w-full xl:w-auto px-4 shadow-sm shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isAddingSlot ? "Adding..." : "Add"}
              </Button>
            </div>
            {slotConflict && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                {slotConflict}
              </p>
            )}
            {newSlotEnd <= newSlotStart && newSlotStart && newSlotEnd && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                End time must be after start time
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
