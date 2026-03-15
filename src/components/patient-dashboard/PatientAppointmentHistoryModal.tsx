import { useState, useMemo } from "react";
import { Icon } from '@iconify/react';

interface PatientAppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: any[];
  formatDate: (timestamp: string) => string;
  formatTime: (timestamp: string) => string;
}

export const PatientAppointmentHistoryModal = ({
  isOpen,
  onClose,
  appointments,
  formatDate,
  formatTime
}: PatientAppointmentHistoryModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const doctorName = apt.doctor_profile?.full_name || "Doctor";
      const specialty = apt.specialty?.name || apt.clinic || "General";
      const searchLower = searchQuery.toLowerCase();
      return (
        doctorName.toLowerCase().includes(searchLower) ||
        specialty.toLowerCase().includes(searchLower) ||
        apt.type?.toLowerCase().includes(searchLower)
      );
    });
  }, [appointments, searchQuery]);

  // Group by "Month Year"
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredAppointments.forEach(apt => {
      const date = new Date(apt.scheduled_at);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(apt);
    });
    return groups;
  }, [filteredAppointments]);

  const monthKeys = Object.keys(groupedAppointments).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const getServiceIcon = (type: string, clinic: string) => {
    if (type === 'online') return 'solar:videocamera-linear';
    if (type === 'home') return 'solar:home-linear';
    return 'solar:hospital-linear';
  };

  const getServiceIconBgName = (type: string) => {
    if(type === 'online') return 'bg-blue-50 text-blue-600';
    if(type === 'home') return 'bg-slate-100 text-slate-500';
    return 'bg-teal-50 text-teal-600';
  }

  const getTitle = (apt: any) => {
    if (apt.type === 'online') return 'Online Consultation';
    if (apt.type === 'home') return 'Home Visit';
    return 'Clinic Visit';
  };

  return (
    <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white dark:bg-slate-950 w-full max-w-lg h-full shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 shrink-0 bg-white dark:bg-slate-950 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white">
              Complete History
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0 -mr-2 flex items-center justify-center"
            >
              <Icon icon="solar:close-circle-linear" className="text-xl" strokeWidth={1.5} />
            </button>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Icon icon="solar:magnifier-linear" className="text-lg" />
            </div>
            <input
              type="text"
              placeholder="Search past appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-slate-900 dark:focus:border-slate-700 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm dark:text-white"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-slate-900/50" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {monthKeys.length === 0 ? (
             <div className="text-center py-10">
                 <p className="text-slate-500 dark:text-slate-400 text-sm">No past appointments found.</p>
             </div>
          ) : (
            monthKeys.map((month) => (
              <div key={month} className="space-y-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm py-2 z-10">
                  {month}
                </h3>
                <div className="space-y-3">
                  {groupedAppointments[month].map((apt) => {
                    const doctorName = apt.doctor_profile?.full_name || "Doctor";
                    const isCancelled = apt.status === 'cancelled';

                    return (
                      <div
                        key={apt.id}
                        className={`flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm gap-4 ${isCancelled ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getServiceIconBgName(apt.type)}`}>
                              <Icon icon={getServiceIcon(apt.type, apt.clinic)} className="text-lg" strokeWidth={1.5} />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-900 dark:text-white tracking-tight">
                                {getTitle(apt)}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{doctorName}</p>
                            </div>
                          </div>
                          
                          {isCancelled ? (
                             <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                               Cancelled
                             </span>
                          ) : (
                             <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium uppercase tracking-wider">
                               Completed
                             </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatTime(apt.scheduled_at)}</p>
                          </div>
                          <button 
                             className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isCancelled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                             disabled={isCancelled}
                          >
                            Details
                            <Icon icon="solar:alt-arrow-right-linear" className="text-base" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
