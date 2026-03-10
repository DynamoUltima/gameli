import { Laptop, Hospital, Home, ArrowRight } from 'lucide-react';

interface Props {
    onBookClick: (title: string, img: string) => void;
}

export function LandingConsultation({ onBookClick }: Props) {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <p className="text-base font-medium text-slate-500 mb-4 tracking-tight">
                        Consultation Types /
                    </p>
                    <h2 className="text-4xl sm:text-5xl lg:text-5xl font-medium text-slate-900 tracking-tighter uppercase leading-[1.1] max-w-2xl">
                        Choose How You
                        <br />
                        Receive Care
                    </h2>
                </div>
                <p className="text-lg font-normal text-slate-600 max-w-sm leading-relaxed mb-2 tracking-tight">
                    Flexible booking options tailored to your schedule, comfort, and lifestyle.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Online Consultation */}
                <div
                    className="group flex flex-col justify-between p-8 sm:p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 cursor-pointer"
                    onClick={() => onBookClick('Online Consultation', 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&q=80&w=800')}
                >
                    <div>
                        <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <Laptop className="w-7 h-7 stroke-[1.5px]" />
                        </div>
                        <h3 className="text-2xl font-medium text-slate-900 tracking-tight mb-4 leading-tight">Telemedicine<br />Consultation</h3>
                        <p className="text-base font-normal text-slate-600 leading-relaxed mb-12 tracking-tight">Convenient virtual care from anywhere.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:gap-3 transition-all duration-300">
                        Book Option
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                            <ArrowRight className="w-4 h-4 stroke-[1.5px]" />
                        </div>
                    </div>
                </div>

                {/* In Person Visit */}
                <div
                    className="group flex flex-col justify-between p-8 sm:p-10 rounded-[2rem] bg-slate-900 text-white hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => onBookClick('In-person Visit', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-500">
                            <Hospital className="w-7 h-7 stroke-[1.5px]" />
                        </div>
                        <h3 className="text-2xl font-medium text-white tracking-tight mb-4 leading-tight">Hospital<br />Visit</h3>
                        <p className="text-base font-normal text-white/70 leading-relaxed mb-12 tracking-tight">Access to our full facilities and direct care.</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 text-sm font-semibold text-white group-hover:gap-3 transition-all duration-300">
                        Book Option
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-slate-900 transition-colors duration-300">
                            <ArrowRight className="w-4 h-4 stroke-[1.5px]" />
                        </div>
                    </div>
                </div>

                {/* Home Visit */}
                <div
                    className="group flex flex-col justify-between p-8 sm:p-10 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 cursor-pointer"
                    onClick={() => onBookClick('Home Visit', 'https://images.unsplash.com/photo-1516156008625-3a9d045f6b28?auto=format&fit=crop&q=80&w=800')}
                >
                    <div>
                        <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-900 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <Home className="w-7 h-7 stroke-[1.5px]" />
                        </div>
                        <h3 className="text-2xl font-medium text-slate-900 tracking-tight mb-4 leading-tight">Home<br />Visit</h3>
                        <p className="text-base font-normal text-slate-600 leading-relaxed mb-12 tracking-tight">Personalized care for those who prefer staying at home.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:gap-3 transition-all duration-300">
                        Book Option
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                            <ArrowRight className="w-4 h-4 stroke-[1.5px]" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
