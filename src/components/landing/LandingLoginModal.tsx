import { X, Lock } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function LandingLoginModal({ isOpen, onClose, onSubmit }: Props) {
    return (
        <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white rounded-[2rem] w-full max-w-md shadow-2xl transform transition-transform duration-300 p-8 relative ${isOpen ? 'scale-100' : 'scale-95'
                    }`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <X className="w-6 h-6 stroke-[1.5px]" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-slate-900/10">
                        <Lock className="w-7 h-7 stroke-[1.5px]" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
                        Welcome back
                    </h3>
                    <p className="text-sm text-slate-500 font-normal">
                        Please sign in to continue booking.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 block tracking-tight">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700 block tracking-tight">
                                Password
                            </label>
                            <a href="#" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <a href="#" className="font-semibold text-slate-900 hover:underline">
                        Create one
                    </a>
                </p>
            </div>
        </div>
    );
}
