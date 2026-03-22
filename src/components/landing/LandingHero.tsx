import { Sparkles, ChevronDown, Stethoscope, HeartPulse, AlertCircle, ArrowRight, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Props {
  onBookClick: (title: string, img: string) => void;
  onContactClick: () => void;
  isServicesMenuOpen: boolean;
  toggleServicesMenu: (e: React.MouseEvent) => void;
  activeCampaign?: any;
}

export function LandingHero({ onBookClick, onContactClick, isServicesMenuOpen, toggleServicesMenu, activeCampaign }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Modern\nHealthcare With\nGentle Care.",
      subtitle: "Expert medical care for healthy, confident lives at every age—delivered with comfort, precision, and trust.",
      image: "/uploaded-banner.jpg"
    }
  ];

  if (activeCampaign) {
    slides.push({
      title: activeCampaign.title || "Awareness Campaign",
      subtitle: activeCampaign.subtitle || "Learn more about our latest healthcare initiative.",
      image: activeCampaign.image_url || "/uploaded-banner.jpg"
    });
  }

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const activeSlide = slides[currentSlide];

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div
        className="relative w-full rounded-[2.5rem] overflow-hidden min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 lg:p-12 transition-all duration-700"
        style={{
          backgroundImage: `url('${activeSlide.image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%'
        }}
      >
        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>

        {/* Navigation inside Hero */}
        <nav className="relative z-50 flex flex-wrap items-center justify-between w-full gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 text-white group">
            <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-10 h-10 object-contain rounded-full shadow-md group-hover:scale-110 transition-transform duration-500" />
            <span className="text-xl font-medium tracking-tight">St. Gamaliel's Hospital</span>
          </a>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <a href="#" className="text-base font-medium text-white">Home</a>
            <div className="relative group" id="navServicesWrapper">
              <button
                onClick={toggleServicesMenu}
                className="text-base font-normal text-white/80 hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none"
              >
                Services
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Services Dropdown */}
              <div
                id="servicesMenu"
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-6 w-[520px] bg-white/95 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl transition-all duration-300 border border-white/20 z-50 flex gap-2 text-slate-900 ${isServicesMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}
              >
                <div className="flex-1 p-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    Our Services
                  </h4>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        onBookClick('Online Consultation', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800');
                        toggleServicesMenu(e);
                      }}
                      className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Online consultation</p>
                          <p className="text-xs text-slate-500">Virtual Care & Diagnostics</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover/item:text-slate-900 transition-colors" />
                    </button>

                    <button
                      onClick={(e) => {
                        onBookClick('Home Visit', 'https://images.unsplash.com/photo-1551076805-e166946c9ebf?auto=format&fit=crop&q=80&w=800');
                        toggleServicesMenu(e);
                      }}
                      className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                          <HeartPulse className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Home Visit</p>
                          <p className="text-xs text-slate-500">Personalized Home Care</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover/item:text-slate-900 transition-colors" />
                    </button>

                    <button
                      onClick={(e) => {
                        onBookClick('Hospital Visit', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800');
                        toggleServicesMenu(e);
                      }}
                      className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Hospital Visit</p>
                          <p className="text-xs text-slate-500">Full Hospital Facilities</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover/item:text-slate-900 transition-colors" />
                    </button>
                  </div>
                </div>

                <div
                  className="w-[200px] relative rounded-[1.5rem] overflow-hidden group cursor-pointer"
                  onClick={(e) => {
                    onBookClick('General Consultation', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800');
                    toggleServicesMenu(e);
                  }}
                >
                  <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Consultation" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-sm font-semibold mb-1 leading-tight tracking-tight">
                      Not sure what you need?
                    </p>
                    <p className="text-xs text-white/80 mb-4">
                      Book a general consultation
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold hover:bg-white/30 transition-colors border border-white/20 shadow-sm">
                      Book Now
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a href="#about" className="text-base font-normal text-white/80 hover:text-white transition-colors">About us</a>
            <button onClick={onContactClick} className="text-base font-normal text-white/80 hover:text-white transition-colors">Contact</button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/auth" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 hover:bg-white/20">
              <UserCircle2 className="w-5 h-5 stroke-[1.5px]" />
              <span className="hidden sm:inline">Portal</span>
            </Link>
            <button
              className="flex items-center gap-3 pl-6 pr-2 py-2 bg-white text-slate-900 rounded-full font-medium text-sm hover:bg-slate-50 hover:scale-105 transition-all shadow-lg shadow-black/10"
              onClick={() => onBookClick('General Consultation', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800')}
            >
              BOOK A CALL
              <div className="bg-slate-100 p-2 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 stroke-[1.5px]" />
              </div>
            </button>
          </div>
        </nav>

        {/* Hero Main Text */}
        <div key={currentSlide} className="relative z-10 flex flex-col md:flex-row justify-between items-end mt-24 md:mt-0 md:absolute md:top-1/2 md:-translate-y-1/2 left-6 sm:left-10 lg:left-12 right-6 sm:right-10 lg:right-12 animate-fade-in">
          <h1
            className="font-medium text-white tracking-tighter leading-[1.05] uppercase max-w-3xl drop-shadow-sm whitespace-pre-line"
            style={{ fontSize: 'clamp(2rem, 7vw, 6.5rem)' }}
          >
            {activeSlide.title}
          </h1>
          <div className="max-w-xs mt-8 md:mt-0 text-white md:pb-6">
            <p className="text-lg font-normal leading-relaxed text-white/90 drop-shadow-sm">
              {activeSlide.subtitle}
            </p>
          </div>
        </div>

        {/* Hero Bottom Elements */}
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end w-full mt-24 gap-8">
          {/* Service Pills */}
          <div className="flex flex-wrap gap-3 max-w-lg">
            <span className="px-5 py-2.5 rounded-full bg-white text-slate-900 text-base font-medium cursor-default shadow-sm">
              General Checkups
            </span>
            <a href="#" className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-base font-normal border border-white/20 hover:bg-white/20 transition-colors">
              Dietetics
            </a>
            <a href="#" className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-base font-normal border border-white/20 hover:bg-white/20 transition-colors">
              Surgery
            </a>
            <a href="#" className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-base font-normal border border-white/20 hover:bg-white/20 transition-colors">
              Pediatrics
            </a>
            <a href="#" className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-base font-normal border border-white/20 hover:bg-white/20 transition-colors">
              Cardiology
            </a>
          </div>

          {/* Floating Card & Pagination */}
          <div className="flex flex-col items-end gap-6 w-full lg:w-auto">
            {/* Pagination */}
            <div className="flex items-center gap-4 text-white/80 text-sm font-medium tracking-tight">
              <button 
                className="hover:text-white transition-colors"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              >&lt;</button>
              <span>0{currentSlide + 1}</span>
              <div className="w-16 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                ></div>
              </div>
              <span>0{slides.length}</span>
              <button 
                className="hover:text-white transition-colors"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              >&gt;</button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
