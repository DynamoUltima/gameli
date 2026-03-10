import { Video, Hospital, Home } from "lucide-react";

interface PatientQuickActionsProps {
    onOpenBooking: (type: string) => void;
}

export const PatientQuickActions = ({ onOpenBooking }: PatientQuickActionsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
            <button
                onClick={() => onOpenBooking('online')}
                className="flex items-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all text-left group"
            >
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Video className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 tracking-tight">
                        Online Visit
                    </h3>
                    <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Video consultation
                    </p>
                </div>
            </button>

            <button
                onClick={() => onOpenBooking('hospital')}
                className="flex items-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all text-left group"
            >
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mr-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                    <Hospital className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 tracking-tight">
                        Clinic Visit
                    </h3>
                    <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        In-person care
                    </p>
                </div>
            </button>

            <button
                onClick={() => onOpenBooking('home')}
                className="flex items-center p-5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all text-left group"
            >
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-4 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Home className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 tracking-tight">
                        Home Visit
                    </h3>
                    <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Care at home
                    </p>
                </div>
            </button>
        </div>
    );
};
