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
                            About St. Gamaliel's Hospital /
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


                </div>
            </div>
        </section>
    );
}
