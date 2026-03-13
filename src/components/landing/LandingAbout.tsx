import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingAbout() {
    return (
        <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
                {/* Left Side: Large Image & Stats Grid */}
                <div className="flex flex-col gap-16">
                    <div className="w-full aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-lg">
                        <img src="/st-gamaliel-hospital.jpg" className="w-full h-full object-cover" alt="St. Gamaliel's Hospital" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4">
                        <div>
                            <p className="text-5xl sm:text-6xl font-medium text-slate-900 tracking-tighter mb-3">
                                98%
                            </p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                                Satisfaction
                                <br />
                                Rate
                            </p>
                        </div>
                        <div>
                            <p className="text-5xl sm:text-6xl font-medium text-slate-900 tracking-tighter mb-3">
                                50K+
                            </p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                                Patients
                                <br />
                                Treated
                            </p>
                        </div>
                        <div>
                            <p className="text-5xl sm:text-6xl font-medium text-slate-900 tracking-tighter mb-3">
                                4.9
                            </p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                                Patients
                                <br />
                                Rating
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Content & Floating Team Cards */}
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <p className="text-base font-medium text-slate-500 mb-4 tracking-tight">
                            About St. Gamaliel /
                        </p>
                        <h2 className="text-4xl sm:text-5xl lg:text-5xl font-medium text-slate-900 tracking-tighter uppercase leading-[1.1] mb-8">
                            Excellence In
                            <br />
                            Healthcare With
                            <br />
                            Compassionate Care
                        </h2>
                        <p className="text-xl font-normal text-slate-600 mb-10 max-w-md leading-relaxed tracking-tight">
                            Discover delighted patient reviews about their comforting and
                            satisfying medical care experience with our trusted professionals.
                        </p>

                        <Link to="/auth" className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-slate-200 text-base font-medium text-slate-900 hover:bg-slate-50 transition-colors shadow-sm no-underline">
                            Login / Register
                            <ArrowUpRight className="w-4 h-4 stroke-[1.5px]" />
                        </Link>
                    </div>

                    {/* Floating Team Cards */}
                    <div className="flex items-end justify-end gap-5 mt-20 relative">
                        {/* Smaller Card */}
                        <div className="relative w-44 h-52 rounded-[1.5rem] overflow-hidden shadow-xl group cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Dr. Albert Flores" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-5 left-5 right-5 text-white">
                                <p className="text-base font-medium leading-tight mb-1 tracking-tight">
                                    Dr. Albert Flores
                                </p>
                                <p className="text-sm font-normal text-white/70">
                                    Pediatrics
                                </p>
                            </div>
                            <div className="absolute bottom-5 right-4">
                                <ArrowUpRight className="w-4 h-4 stroke-[1.5px]" />
                            </div>
                        </div>

                        {/* Taller Card */}
                        <div className="relative w-52 h-64 rounded-[1.5rem] overflow-hidden shadow-xl group cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Dr. Theresa Webb" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <p className="text-lg font-medium leading-tight mb-1 tracking-tight">
                                    Dr. Theresa Webb
                                </p>
                                <p className="text-sm font-normal text-white/70">
                                    Cardiology
                                </p>
                            </div>
                            <div className="absolute bottom-6 right-5 z-10">
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <ArrowUpRight className="w-4 h-4 text-white stroke-[1.5px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
