import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
    onBookClick: (title: string, img: string) => void;
}

export function LandingServices({ onBookClick }: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340 + 20; // card width + gap
            if (direction === 'left') {
                scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
                {/* Left Side: Header & Reviews */}
                <div className="lg:col-span-4 flex flex-col justify-between">
                    <div>
                        <p className="text-base font-medium text-slate-500 mb-4 tracking-tight">
                            Our Features /
                        </p>
                        <h2 className="text-3xl sm:text-4xl lg:text-4xl font-medium text-slate-900 tracking-tighter uppercase leading-[1.1] mb-6 max-w-sm">
                            Discover Our Signature
                            <br />
                            Medical Departments
                        </h2>
                    </div>

                    <div className="mt-12 lg:mt-0">
                        {/* Reviews block */}
                        <div className="mb-8">
                            <div>
                                <p className="text-xl font-medium text-slate-900 leading-tight tracking-tight">
                                    2,500+
                                </p>
                                <p className="text-base font-normal text-slate-500 leading-tight">
                                    Reviews
                                </p>
                            </div>
                        </div>
                        <p className="text-base font-normal text-slate-600 max-w-sm mb-10 leading-relaxed">
                            Discover delighted patient reviews about their comforting and
                            satisfying medical care experience.
                        </p>

                        {/* Navigation Controls */}
                        <div className="flex gap-3">
                            <button onClick={() => scroll('left')} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                                <ArrowLeft className="w-5 h-5 stroke-[1.5px]" />
                            </button>
                            <button onClick={() => scroll('right')} className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-md">
                                <ArrowRight className="w-5 h-5 stroke-[1.5px]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Description & Carousel */}
                <div className="lg:col-span-8 flex flex-col justify-between">
                    <p className="text-base sm:text-lg font-normal text-slate-600 max-w-xl mb-12 lg:ml-auto leading-relaxed tracking-tight">
                        Experience modern medical care delivered with comfort, precision, and
                        attention to detail. St. Gamaliel's Hospital provides a state-of-the-art, welcoming
                        environment designed to promote rapid recovery and well-being.
                    </p>

                    {/* Cards Carousel */}
                    <div ref={scrollContainerRef} className="flex gap-5 overflow-x-auto pb-6 snap-x hide-scrollbar scroll-smooth">
                        {/* Service Card 1 */}
                        <div
                            className="relative min-w-[280px] sm:min-w-[340px] h-[340px] rounded-[2rem] overflow-hidden group snap-center cursor-pointer"
                            onClick={() => onBookClick('Emergency Care', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800')}
                        >
                            <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Emergency Care" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                                <h3 className="text-2xl font-medium text-white tracking-tight leading-tight">
                                    Emergency
                                    <br />
                                    Care
                                </h3>
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white/30 transition-colors">
                                    <ArrowRight className="w-5 h-5 stroke-[1.5px]" />
                                </div>
                            </div>
                        </div>

                        {/* Service Card 2 */}
                        <div
                            className="relative min-w-[280px] sm:min-w-[340px] h-[340px] rounded-[2rem] overflow-hidden group snap-center cursor-pointer"
                            onClick={() => onBookClick('General Checkups', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800')}
                        >
                            <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="General Checkups" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                                <h3 className="text-2xl font-medium text-white tracking-tight leading-tight">
                                    General
                                    <br />
                                    Checkups
                                </h3>
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white/30 transition-colors">
                                    <ArrowRight className="w-5 h-5 stroke-[1.5px]" />
                                </div>
                            </div>
                        </div>

                        {/* Service Card 3 */}
                        <div
                            className="relative min-w-[280px] sm:min-w-[340px] h-[340px] rounded-[2rem] overflow-hidden group snap-center cursor-pointer"
                            onClick={() => onBookClick('Specialist Care', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800')}
                        >
                            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Specialist Care" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                                <h3 className="text-2xl font-medium text-white tracking-tight leading-tight">
                                    Specialist
                                    <br />
                                    Care
                                </h3>
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white/30 transition-colors">
                                    <ArrowRight className="w-5 h-5 stroke-[1.5px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
