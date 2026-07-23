import { Edit, LogOut } from "lucide-react";

interface PatientProfileCardProps {
    fullName: string;
    initials: string;
    profileData: {
        phone: string;
        gender: string;
        date_of_birth: string;
        hospital_card_id: string;
    };
    calculateAge: (dob: string) => number | null;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export const PatientProfileCard = ({
    fullName,
    initials,
    profileData,
    calculateAge,
    onEditProfile,
    onSignOut
}: PatientProfileCardProps) => {
    return (
        <div className="flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h2 className="text-lg font-medium tracking-tight text-slate-900 dark:text-white">
                        Patient Profile
                    </h2>
                    <button
                        onClick={onEditProfile}
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                    >
                        <Edit className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-28 h-28 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-3xl font-medium tracking-tight mb-5 shadow-lg shadow-slate-900/10 ring-4 ring-slate-50 dark:ring-slate-950 relative">
                        {initials || "PT"}
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
                    </div>
                    <h3 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white mb-1">
                        {fullName || "James Bond"}
                    </h3>
                    {/* <p className="text-sm font-normal text-slate-500 dark:text-slate-400">Premium Patient</p> */}
                    {profileData.hospital_card_id && (
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            ID: {profileData.hospital_card_id}
                        </p>
                    )}
                </div>

                {/* Details List */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center py-3.5 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Age</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                            {profileData.date_of_birth ? `${calculateAge(profileData.date_of_birth)} years` : "Not set"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3.5 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Gender</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200 capitalize">
                            {profileData.gender || "Not set"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3.5 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Phone</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                            {profileData.phone || "Not set"}
                        </span>
                    </div>
                </div>

                {/* Sign Out Action */}
                <button
                    onClick={onSignOut}
                    className="w-full mt-8 py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100 dark:border-red-500/20"
                >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};
