import { useState } from "react";
import { Calendar, Clock, Plus, Video, Loader2, Home, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from '@iconify/react';

interface PatientAppointmentsProps {
    upcomingAppointments: any[];
    pastAppointments: any[];
    loadingAppointments: boolean;
    onOpenBooking: (type?: string) => void;
    onOpenHistory: () => void;
    formatDate: (timestamp: string) => string;
    formatTime: (timestamp: string) => string;
}

export const PatientAppointments = ({
    upcomingAppointments,
    pastAppointments,
    loadingAppointments,
    onOpenBooking,
    onOpenHistory,
    formatDate,
    formatTime
}: PatientAppointmentsProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;
    
    // Pagination logic
    const totalPages = Math.ceil(upcomingAppointments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUpcoming = upcomingAppointments.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    };

    // Select up to 3 past appointments to show on the dashboard
    const previewPastAppointments = pastAppointments.slice(0, 3);
    
    const getServiceIcon = (type: string, clinic: string) => {
      if (type === 'online') return 'solar:videocamera-linear';
      if (type === 'home') return 'solar:home-linear';
      return 'solar:hospital-linear';
    };

    const getServiceIconLucide = (type: string) => {
      if (type === 'online') return <Video className="w-3.5 h-3.5" />;
      if (type === 'home') return <Home className="w-3.5 h-3.5" />;
      return <Building2 className="w-3.5 h-3.5" />;
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
        <div className="flex flex-col gap-6 sm:gap-8 h-full">
            {/* 1. Upcoming Appointments Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div>
                        <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
                            Upcoming Appointments
                        </h2>
                        <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
                            Your scheduled consultations
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenBooking('online')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" strokeWidth={1.5} />
                        New
                    </button>
                </div>

                {loadingAppointments ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : upcomingAppointments.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 border border-slate-100 dark:border-slate-800">
                            <Calendar className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white mb-2">
                            No upcoming appointments
                        </h3>
                        <p className="text-base font-normal text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                            Book your first appointment to get started with your
                            personalized care plan.
                        </p>
                        <button
                            onClick={() => onOpenBooking('online')}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95"
                        >
                            <Plus className="w-5 h-5" strokeWidth={1.5} />
                            Book Appointment
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                      <div className="space-y-4 flex-1">
                          {paginatedUpcoming.map((apt) => {
                              const doctorName = apt.doctor_profile?.full_name || "Doctor";
                              const specialty = apt.specialty?.name || apt.clinic || "General";
                              const doctorInitials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

                              return (
                                  <div key={apt.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                      <div className="flex items-start justify-between">
                                          <div className="flex gap-4">
                                              <Avatar className="h-12 w-12 rounded-xl border border-slate-100 dark:border-slate-800">
                                                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium">
                                                      {doctorInitials}
                                                  </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                    <h4 className="text-base font-medium text-slate-900 dark:text-white tracking-tight">{doctorName}</h4>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                                      {getServiceIconLucide(apt.type)}
                                                      <span>{apt.type}</span>
                                                    </div>
                                                  </div>
                                                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">{specialty}</p>
                                                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                          <Calendar className="w-4 h-4" />
                                                          <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(apt.scheduled_at)}</span>
                                                      </div>
                                                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                          <Clock className="w-4 h-4" />
                                                          <span className="font-medium text-slate-700 dark:text-slate-300">{formatTime(apt.scheduled_at)}</span>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                          <Badge variant={apt.status === "pending" || apt.status === "confirmed" ? "default" : "secondary"} className="rounded-lg shadow-none font-medium px-2.5 py-1 uppercase text-[10px] tracking-wider">
                                              {apt.status}
                                          </Badge>
                                      </div>
                                      {(apt.status === "pending" || apt.status === "confirmed") && apt.type === "online" && (
                                          <Button 
                                            className="w-full mt-5 rounded-xl border-slate-200 dark:border-slate-800 font-medium h-11 shadow-sm text-slate-900 dark:text-white dark:bg-slate-900 dark:hover:bg-slate-800" 
                                            variant={apt.meet_link ? "default" : "outline"}
                                            onClick={() => apt.meet_link ? window.open(apt.meet_link, '_blank') : null}
                                            disabled={!apt.meet_link}
                                          >
                                              <Video className="w-4 h-4 mr-2" />
                                              {apt.meet_link ? "Join Video Call" : "Link Not Ready"}
                                          </Button>
                                      )}
                                  </div>
                              );
                          })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800 mt-6">
                          <p className="text-sm text-slate-500">
                            Showing <span className="font-medium text-slate-900 dark:text-white">{startIndex + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, upcomingAppointments.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{upcomingAppointments.length}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-9 h-9 p-0 rounded-lg border-slate-200 flex items-center justify-center disabled:opacity-50"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{currentPage}</span>
                              <span className="text-slate-400 text-xs">/</span>
                              <span className="text-sm text-slate-500">{totalPages}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-9 h-9 p-0 rounded-lg border-slate-200 flex items-center justify-center disabled:opacity-50"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                )}
            </div>

            {/* 2. Appointment History Card */}
            {!loadingAppointments && (
              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
                      Appointment History
                    </h2>
                    <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
                      Review your past consultations and records
                    </p>
                  </div>
                  <button 
                    onClick={onOpenHistory}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 w-full sm:w-auto"
                  >
                    View All
                    <Icon icon="solar:alt-arrow-right-linear" className="text-base" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="space-y-4">
                    {previewPastAppointments.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No past appointments found.</p>
                        </div>
                    ) : (
                        previewPastAppointments.map((apt) => {
                            const doctorName = apt.doctor_profile?.full_name || "Doctor";
                            const specialty = apt.specialty?.name || apt.clinic || "General";
                            const isCancelled = apt.status === 'cancelled';
                            
                            return (
                                <div key={apt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors gap-4 ${isCancelled ? 'opacity-75' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${getServiceIconBgName(apt.type)}`}>
                                            <Icon icon={getServiceIcon(apt.type, apt.clinic)} className="text-lg sm:text-xl" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white tracking-tight">{getTitle(apt)}</h3>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{doctorName} • {specialty}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatTime(apt.scheduled_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isCancelled ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium uppercase tracking-wider">
                                                    Completed
                                                </span>
                                            )}
                                            <button 
                                                className={`w-8 h-8 flex items-center justify-center transition-colors rounded-lg border shadow-sm ${isCancelled ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 cursor-not-allowed' : 'text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                                disabled={isCancelled}
                                                title={isCancelled ? "No Notes Available" : "View Notes"}
                                            >
                                                <Icon icon="solar:document-text-linear" className="text-base" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
              </div>
            )}
        </div>
    );
};
