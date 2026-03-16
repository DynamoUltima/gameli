import { Bell, HeartPulse, Settings } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import { Notification } from "@/pages/PatientDashboard";

interface PatientNavProps {
    fullName: string;
    initials: string;
    unreadCount: number;
    notifications: Notification[];
    onMarkAllRead: () => void;
    formatRelativeTime: (time: string) => string;
    getNotificationIcon: (notification: Notification) => React.ReactNode;
    onNotificationClick: (notification: Notification) => void;
}

export const PatientNav = ({
    fullName,
    initials,
    unreadCount,
    notifications,
    onMarkAllRead,
    formatRelativeTime,
    getNotificationIcon,
    onNotificationClick
}: PatientNavProps) => {
    return (
        <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo and Navigation */}
                <div className="flex items-center gap-6">
                    <div
                        className="flex items-center gap-3 text-slate-900 dark:text-white group cursor-pointer"
                        onClick={() => window.location.href = '/'}
                    >
                        <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-8 h-8 rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300 object-contain" />
                        <span className="text-xl font-medium tracking-tight">St. Gamaliel's Hospital</span>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Landing Page
                        </button>
                        <button
                            onClick={() => window.location.href = '/dashboard/admin'}
                            className="hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Admin Dashboard
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400">
                    <ThemeSwitcher />

                    {/* Notifications Dropdown */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="hover:text-slate-900 dark:hover:text-white transition-colors relative flex items-center justify-center p-1">
                                <Bell className="w-5 h-5" strokeWidth={1.5} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 rounded-2xl border-slate-200 shadow-xl overflow-hidden bg-white" align="end">
                            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                                    Notifications
                                </h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={onMarkAllRead}
                                        className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[22rem] w-full overflow-y-auto hide-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center flex flex-col items-center">
                                        <Bell className="w-8 h-8 text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-5 px-6 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${
                                                    ['completed', 'form_completed', 'cancelled'].includes(notification.type) ? 'opacity-60' : ''
                                                }`}
                                                onClick={() => onNotificationClick(notification)}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {getNotificationIcon(notification)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[15px] text-slate-900 font-medium tracking-tight">
                                                            {notification.title || (
                                                                notification.type === 'confirmed' ? 'Appointment confirmed' :
                                                                notification.type === 'cancelled' ? 'Appointment cancelled' :
                                                                notification.type === 'completed' ? 'Appointment completed' :
                                                                notification.type === 'pending' ? 'Appointment pending' :
                                                                'Notification'
                                                            )}
                                                        </p>
                                                        {notification.isForm && notification.type === 'form_pending' && (
                                                            <span className="px-1.5 py-0.5 bg-red-100/80 text-red-600 rounded text-[11px] font-medium tracking-wide uppercase">
                                                                Action
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[13px] text-slate-500 mt-0.5 leading-[1.45]">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                                                        {formatRelativeTime(notification.time)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-3 bg-white flex justify-center border-t border-slate-100">
                                    <button className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    <button className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center">
                        <Settings className="w-5 h-5" strokeWidth={1.5} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-sm font-medium ml-2 shadow-sm cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors border-2 border-slate-100 dark:border-slate-800">
                        {initials || "PT"}
                    </div>
                </div>
            </div>
        </nav>
    );
};
