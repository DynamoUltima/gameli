import { X, CheckCircle, ArrowRight, ShieldCheck, Wand2 } from 'lucide-react';
import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    serviceConfig: { title: string; img: string } | null;
    currentStep: number;
    onNext: () => void;
    onPrev: () => void;
}

export function LandingBookingModal({ isOpen, onClose, serviceConfig, currentStep, onNext, onPrev }: Props) {
    const totalSteps = 4;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientEmail, setPatientEmail] = useState("");

    const amountToPay = serviceConfig?.title === 'Emergency Care' ? 500 : 250;
    
    const paystackConfig = {
        reference: (new Date()).getTime().toString(),
        email: patientEmail || "guest@example.com",
        amount: amountToPay * 100, 
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
        currency: "GHS",
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const handleNextClick = () => {
        if (currentStep === 3) {
            // Basic validation check - normally you'd use a form ref
            const form = document.getElementById('bookingForm') as HTMLFormElement;
            if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (!isSubmitting) {
                setIsSubmitting(true);
                initializePayment({
                    onSuccess: () => {
                        setIsSubmitting(false);
                        onNext();
                    },
                    onClose: () => {
                        setIsSubmitting(false);
                    }
                });
            }
            return;
        } else if (currentStep === 4) {
            onClose();
            return;
        }
        onNext();
    };

    const getServiceDesc = (title: string) => {
        if (title === 'Emergency Care') return 'Immediate, 24/7 medical attention for urgent health conditions, injuries, and critical situations. Our trauma team is always ready.';
        if (title === 'General Checkups') return 'Comprehensive physical exams, health screenings, and preventative care to keep you and your family healthy for years to come.';
        if (title === 'Specialist Care') return 'Advanced treatments and specialized consultations from our board-certified experts in cardiology, surgery, and more.';
        if (title === 'Online Consultation') return 'Convenient virtual care from anywhere. Speak securely with our medical professionals from the comfort of your home.';
        if (title === 'In-person Visit') return 'Access to our full diagnostic facilities and direct care. Experience modern medical attention in our comfortable hospital environment.';
        if (title === 'Home Visit') return 'Personalized medical care for those who prefer or need to stay at home. We bring essential health services directly to you.';
        return 'Schedule a consultation with our experienced medical professionals to discuss your personalized health plan.';
    };

    const isVisible = isOpen && serviceConfig;

    return (
        <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl transform flex flex-col max-h-[90vh] overflow-hidden transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'
                    }`}
            >
                {/* Progress Header */}
                <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20 ${currentStep === 4 ? 'hidden' : ''}`}>
                    <div className="flex items-center w-full max-w-sm gap-2 relative">
                        {/* Connective Line Base */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-slate-100 z-0"></div>
                        {/* Connective Line Active */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 left-4 h-0.5 bg-slate-900 z-0 transition-all duration-500"
                            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                        ></div>

                        {/* Step 1 Ind */}
                        <div className="flex items-center gap-3 relative z-10 bg-white pr-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ring-4 ring-white ${currentStep >= 1 ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
                                    }`}
                            >
                                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                            </div>
                            <span className={`text-sm font-semibold hidden sm:block ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                                Details
                            </span>
                        </div>
                        <div className="flex-1"></div>

                        {/* Step 2 Ind */}
                        <div className="flex items-center gap-3 relative z-10 bg-white px-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ring-4 ring-white ${currentStep >= 2 ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
                                    }`}
                            >
                                {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                            </div>
                            <span className={`text-sm font-semibold hidden sm:block ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                                Schedule
                            </span>
                        </div>
                        <div className="flex-1"></div>

                        {/* Step 3 Ind */}
                        <div className="flex items-center gap-3 relative z-10 bg-white pl-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ring-4 ring-white ${currentStep >= 3 ? 'bg-slate-900 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
                                    }`}
                            >
                                {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                            </div>
                            <span className={`text-sm font-semibold hidden sm:block ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                                Account
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-4"
                    >
                        <X className="w-6 h-6 stroke-[1.5px]" />
                    </button>
                </div>

                {/* Scrollable Flow Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {/* STEP 1: SERVICE DETAILS */}
                    {currentStep === 1 && serviceConfig && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden relative shadow-sm">
                                <img src={serviceConfig.img} className="absolute inset-0 w-full h-full object-cover" alt="Service Image" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <span className="inline-block px-3 py-1 mb-2 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wide uppercase border border-white/20">
                                        Medical Service
                                    </span>
                                    <h3 className="text-3xl font-semibold tracking-tight text-white leading-tight">
                                        {serviceConfig.title}
                                    </h3>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">
                                    About this care
                                </h4>
                                <p className="text-slate-600 font-normal leading-relaxed text-sm sm:text-base">
                                    {getServiceDesc(serviceConfig.title)}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <ShieldCheck className="w-5 h-5 text-slate-900 stroke-[1.5px]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Expert Consultation</p>
                                        <p className="text-xs text-slate-500">Board-certified doctors</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Wand2 className="w-5 h-5 text-slate-900 stroke-[1.5px]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Gentle Care</p>
                                        <p className="text-xs text-slate-500">Advanced medical tech</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SCHEDULE */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
                                    Select Date & Time
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    Choose a slot that works best for you.
                                </p>
                            </div>

                            {/* Dates Grid */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                    October
                                </h4>
                                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                                        <label key={day} className="cursor-pointer shrink-0">
                                            <input type="radio" name="flowDate" value={12 + idx} className="peer sr-only" defaultChecked={idx === 0} />
                                            <div className="w-20 py-4 border border-slate-200 rounded-2xl text-center hover:border-slate-300 transition-all">
                                                <div className="text-xs font-semibold uppercase mb-1 text-slate-500">{day}</div>
                                                <div className="text-xl font-semibold tracking-tight">{12 + idx}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Times Grid */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                    Available Times
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'].map((time, idx) => (
                                        <label key={time} className="cursor-pointer">
                                            <input type="radio" name="flowTime" value={time} className="peer sr-only" defaultChecked={idx === 2} />
                                            <div className="px-4 py-3 border border-slate-200 rounded-xl text-center text-sm font-semibold hover:border-slate-300 transition-all">
                                                {time}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PATIENT INFO */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
                                    Patient Details
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    Confirm your contact information to finalize the booking.
                                </p>
                            </div>

                            <form id="bookingForm" className="space-y-5" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 block">First Name</label>
                                        <input type="text" required defaultValue="John" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="John" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700 block">Last Name</label>
                                        <input type="text" required defaultValue="Doe" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 block">Phone Number</label>
                                    <input type="tel" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="0533-675-498" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
                                    <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 text-sm" placeholder="john@example.com" />
                                </div>

                                <button type="submit" id="hiddenSubmit" className="hidden"></button>
                            </form>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {currentStep === 4 && (
                        <div className="flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in flex">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2">
                                <CheckCircle className="w-10 h-10 stroke-2" />
                            </div>
                            <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Booking Confirmed!
                            </h3>
                            <p className="text-slate-500 max-w-sm text-center text-sm sm:text-base">
                                Your appointment has been successfully scheduled. We've sent a
                                confirmation email with all the details.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Footer */}
                {currentStep < 4 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 sticky bottom-0 z-20">
                        <button
                            type="button"
                            onClick={onPrev}
                            className={`px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors ${currentStep === 1 ? 'invisible' : ''}`}
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleNextClick}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 disabled:opacity-75 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2"
                        >
                            <span>
                                {isSubmitting ? 'Processing...' : currentStep === 1 ? 'Continue to Schedule' : currentStep === 2 ? 'Continue to Details' : 'Confirm & Pay'}
                            </span>
                            {!isSubmitting && (
                                currentStep === 3 ? (
                                    <CheckCircle className="w-5 h-5 stroke-[1.5px]" />
                                ) : (
                                    <ArrowRight className="w-5 h-5 stroke-[1.5px]" />
                                )
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
