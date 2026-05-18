import { Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingFooter() {
    return (
        <div className="p-3 sm:p-6 lg:p-8">
            <footer className="bg-slate-900 rounded-[2.5rem] px-8 py-16 sm:px-16 sm:py-20 flex flex-col gap-12 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Link to="/" className="flex items-center gap-3 text-white group w-fit">
                            <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-10 h-10 object-contain rounded-full shadow-md group-hover:scale-110 transition-transform duration-500" />
                            <span className="text-xl font-medium tracking-tight">St. Gamaliel's Hospital</span>
                        </Link>
                        <p className="text-white/70 text-base font-normal leading-relaxed max-w-sm">
                            Expert medical care for healthy, confident lives at every
                            age delivered with comfort, precision, and trust.
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <a href="https://www.instagram.com/st.gamalielshospital/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors shadow-sm">
                                <Instagram className="w-4 h-4 stroke-[1.5px]" />
                            </a>
                            <a href="https://x.com/st_gamaliels" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors shadow-sm">
                                <Twitter className="w-4 h-4 stroke-[1.5px]" />
                            </a>
                            <a href="https://web.facebook.com/profile.php?id=100094774093355" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors shadow-sm">
                                <Facebook className="w-4 h-4 stroke-[1.5px]" />
                            </a>
                        </div>
                    </div>
                    <div className="lg:col-span-2 lg:col-start-7 flex flex-col gap-4">
                        <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-2">
                            Services
                        </h4>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Checkups
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Emergency
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Surgery
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Pharmacy
                        </a>
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-2">
                            St. Gamaliel's Hospital
                        </h4>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            About Us
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Careers
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Blog
                        </a>
                        <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Contact
                        </a>
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <h4 className="text-xs font-semibold text-white tracking-widest uppercase mb-2">
                            Legal
                        </h4>
                        <Link to="/privacy-policy" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Privacy Policy
                        </Link>
                        <Link to="/terms-of-service" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                            Terms of Service
                        </Link>
                    </div>
                </div>
                <div className="w-full h-px bg-white/10"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/50 text-xs font-medium">
                    <p>© {new Date().getFullYear()} St. Gamaliel's Hospital. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
