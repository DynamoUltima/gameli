import { Calendar, Clock, Plus, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PatientAppointmentsProps {
    appointments: any[];
    loadingAppointments: boolean;
    onOpenBooking: (type?: string) => void;
    formatDate: (timestamp: string) => string;
    formatTime: (timestamp: string) => string;
}

export const PatientAppointments = ({
    appointments,
    loadingAppointments,
    onOpenBooking,
    formatDate,
    formatTime
}: PatientAppointmentsProps) => {
    return (
        <div className="flex flex-col h-full">
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex-1 flex flex-col shadow-sm">
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
                        onClick={() => onOpenBooking('hospital')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" strokeWidth={1.5} />
                        New
                    </button>
                </div>

                {loadingAppointments ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : appointments.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
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
                    <div className="space-y-4 flex-1">
                        {appointments.map((apt) => {
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
                                                <h4 className="text-base font-medium text-slate-900 dark:text-white tracking-tight">{doctorName}</h4>
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
                                        <Badge variant={apt.status === "pending" || apt.status === "confirmed" ? "default" : "secondary"} className="rounded-lg shadow-none font-medium px-2.5 py-1">
                                            {apt.status}
                                        </Badge>
                                    </div>
                                    {(apt.status === "pending" || apt.status === "confirmed") && apt.type === "online" && (
                                        <Button className="w-full mt-5 rounded-xl border-slate-200 dark:border-slate-800 font-medium h-11 shadow-sm text-slate-900 dark:text-white dark:bg-slate-900 dark:hover:bg-slate-800" variant="outline">
                                            <Video className="w-4 h-4 mr-2" />
                                            Join Video Call
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
