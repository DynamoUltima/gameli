import { X, Mail, MapPin, Phone, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function LandingContactModal({ isOpen, onClose }: Props) {
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSuccess(true);
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => setIsSuccess(false), 300);
    };

    return (
        <div
            onClick={handleClose}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl transform flex flex-col md:flex-row max-h-[90vh] overflow-hidden relative border border-slate-100 transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'
                    }`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shadow-sm border border-slate-200 md:bg-transparent md:border-none md:shadow-none md:text-white md:hover:bg-white/10"
                >
                    <X className="w-6 h-6 stroke-[1.5px]" />
                </button>

                {/* Left: Info */}
                <div className="md:w-2/5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
                    {/* bg deco */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h3 className="text-3xl font-semibold tracking-tight mb-3">
                            Get in touch
                        </h3>
                        <p className="text-white/70 text-sm mb-12 leading-relaxed font-normal">
                            We'd love to hear from you. Our friendly team is always here to
                            chat and help with any inquiries.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1 tracking-tight">Chat with us</p>
                                    <p className="text-xs text-white/60 mb-1.5 font-normal">Our friendly team is here to help.</p>
                                    <a href="mailto:hello@dental.com" className="text-sm font-medium hover:text-white/80 transition-colors">
                                        hello@dental.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1 tracking-tight">Visit us</p>
                                    <p className="text-xs text-white/60 mb-1.5 font-normal">Come say hello at our clinic HQ.</p>
                                    <p className="text-sm font-medium leading-relaxed">
                                        100 Smith Street
                                        <br />
                                        Collingwood VIC 3066 AU
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1 tracking-tight">Call us</p>
                                    <p className="text-xs text-white/60 mb-1.5 font-normal">Mon-Fri from 8am to 5pm.</p>
                                    <a href="tel:+15550000000" className="text-sm font-medium hover:text-white/80 transition-colors">
                                        +1 (555) 000-0000
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="md:w-3/5 p-8 sm:p-10 overflow-y-auto bg-white relative">
                    <form id="contactForm" className="space-y-6 h-full" onSubmit={handleSubmit}>
                        {!isSuccess ? (
                            <div className="flex flex-col h-full justify-center animate-fade-in">
                                <div className="mb-8">
                                    <h4 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                                        Send us a message
                                    </h4>
                                    <p className="text-sm text-slate-500 font-normal">
                                        Fill out the form below and we'll reply shortly.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 block tracking-tight">First Name</label>
                                        <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="John" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 block tracking-tight">Last Name</label>
                                        <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 mb-5">
                                    <label className="text-sm font-semibold text-slate-700 block tracking-tight">Email Address</label>
                                    <input type="email" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-1.5 mb-8">
                                    <label className="text-sm font-semibold text-slate-700 block tracking-tight">Message</label>
                                    <textarea required rows={4} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm resize-none" placeholder="How can we help you today?"></textarea>
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]">
                                    Send Message
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center h-full animate-fade-in">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-5 shadow-sm border border-green-100">
                                    <CheckCircle className="w-10 h-10 stroke-2" />
                                </div>
                                <h4 className="text-3xl font-semibold tracking-tight text-slate-900 mb-3">
                                    Message Sent!
                                </h4>
                                <p className="text-slate-500 text-base max-w-sm font-normal">
                                    Thank you for reaching out. We have received your message and
                                    will get back to you shortly.
                                </p>
                                <button type="button" onClick={handleClose} className="mt-8 px-8 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
                                    Close Window
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
