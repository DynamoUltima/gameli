import React, { useState, useEffect } from 'react';
import { sendEmail } from "@/lib/emailService";
import { sendSms } from "@/lib/smsService";
import {
    X,
    CheckCircle,
    ChevronDown,
    Info,
    ChevronLeft,
    ChevronRight,
    Smartphone,
    CreditCard,
    CheckCircle2,
    Download,
    ArrowRight
} from 'lucide-react';
import { useDoctors } from '@/hooks/useDoctors';
import { useDoctorSchedules } from '@/hooks/useDoctorSchedules';
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, addMinutes, isBefore, isSameDay, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePaystackPayment } from "react-paystack";

interface PatientBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookingSuccess?: () => void;
    bookingType: string | null;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
}

export const PatientBookingModal = ({ isOpen, onClose, onBookingSuccess, bookingType, patientName, patientEmail, patientPhone }: PatientBookingModalProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const nameParts = (patientName || "").trim().split(/\s+/);
    const initialFirstName = nameParts[0] || "";
    const initialLastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Controlled state for personal info fields — pre-populated from props
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [personalPhone, setPersonalPhone] = useState(patientPhone || "");
    const [personalEmail, setPersonalEmail] = useState(patientEmail || "");

    const [clinic, setClinic] = useState("");
    const [consultationFor, setConsultationFor] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [partnerEmail, setPartnerEmail] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("mobile");

    // Extra personal info fields
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const [homeAddress, setHomeAddress] = useState("");
    const [isBookingForOther, setIsBookingForOther] = useState(false);
    const [otherPatientName, setOtherPatientName] = useState("");
    const [otherPatientPhone, setOtherPatientPhone] = useState("");
    const [relationship, setRelationship] = useState("");

    const [preferredDoctor, setPreferredDoctor] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { doctors, specialties, loading } = useDoctors();
    const { getAvailableSlots } = useDoctorSchedules();

    const selectedSpecialty = specialties.find(s => s.id === clinic);
    const amountToPay = selectedSpecialty?.cost || (bookingType === 'hospital' ? 144 : bookingType === 'online' ? 45 : 0);
    const filteredDoctors = doctors.filter(doc => 
        (doc.specialty_id === clinic || doc.specialties?.some(s => s.id === clinic)) && doc.available
    );
    const isFertility = selectedSpecialty?.name?.toLowerCase().includes('fertility');

    const paystackConfig = {
        reference: (new Date()).getTime().toString(),
        email: patientEmail || user?.email || "patient@example.com",
        amount: amountToPay * 100, // Amount in pesewas
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
        currency: "GHS",
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    // When props update (e.g., dashboard finishes loading), sync into state
    useEffect(() => {
        const parts = (patientName || "").trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
        setPersonalPhone(patientPhone || "");
        setPersonalEmail(patientEmail || "");
    }, [patientName, patientPhone, patientEmail]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!preferredDoctor) {
                setAvailabilitySlots([]);
                return;
            }
            
            setLoadingAvailability(true);
            try {
                const { data, error } = await supabase
                    .from('doctor_availability')
                    .select('*')
                    .eq('doctor_id', preferredDoctor);

                if (error) throw error;
                setAvailabilitySlots(data || []);
            } catch (error: any) {
                console.error("Error fetching availability:", error);
                toast({
                    title: "Error fetching schedule",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setLoadingAvailability(false);
            }
        };

        fetchAvailability();
    }, [preferredDoctor, toast]);

    useEffect(() => {
        const fetchTimes = async () => {
            if (!selectedDate || !preferredDoctor) {
                setAvailableTimes([]);
                setSelectedTime('');
                return;
            }
            try {
                const slots = await getAvailableSlots(preferredDoctor, selectedDate);
                const formattedTimes = slots.map(slot => format(new Date(slot), 'hh:mm a'));
                
                setAvailableTimes(formattedTimes);
                if (selectedTime && !formattedTimes.includes(selectedTime)) {
                    setSelectedTime(''); 
                }
            } catch (error) {
                console.error("Error fetching available times:", error);
                setAvailableTimes([]);
                setSelectedTime('');
            }
        };

        fetchTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, preferredDoctor, getAvailableSlots]);

    const processBookingSuccess = async (paymentReference?: any) => {
        setIsSubmitting(true);
        try {
            let scheduledAt: string | null = null;
            if (selectedDate && selectedTime) {
                // Parse "09:00 AM" and combine with selectedDate
                const [timeStr, modifier] = selectedTime.split(' ');
                let [hours, minutes] = timeStr.split(':').map(Number);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                
                const dateObj = new Date(selectedDate);
                dateObj.setHours(hours, minutes, 0, 0);
                scheduledAt = dateObj.toISOString();
            }
            
            const { data: appt, error: apptErr } = await supabase
                .from('appointments' as any)
                .insert({
                    patient_id: (user as any)?.uid || (user as any)?.id,
                    doctor_id: preferredDoctor,
                    clinic: (specialties.find(s => s.id === clinic)?.name) || null,
                    specialty_id: clinic || null,
                    type: bookingType,
                    scheduled_at: scheduledAt ?? new Date().toISOString(),
                    symptoms: "Online consultation booking", // Default symptom or text from form if available
                    status: "confirmed",
                    payment_status: paymentReference ? "paid" : "pending"
                })
                .select('id, doctor_id, scheduled_at')
                .maybeSingle();
                
            if (apptErr) throw apptErr;

            // Send appointment confirmation email to patient
            const selectedDoc = doctors.find(d => d.user_id === preferredDoctor);
            const dateStr = selectedDate ? format(selectedDate, 'MMMM do, yyyy') : '';
            
            const notificationData = {
                patientEmail: personalEmail || patientEmail,
                patientPhone: isBookingForOther ? otherPatientPhone : (personalPhone || patientPhone),
                patientName: isBookingForOther ? otherPatientName : (`${firstName} ${lastName}`.trim() || patientName),
                bookerName: isBookingForOther ? `${firstName} ${lastName}`.trim() : undefined,
                bookerPhone: isBookingForOther ? personalPhone : undefined,
                relationship: isBookingForOther ? relationship : undefined,
                secondaryPhone: secondaryPhone || undefined,
                homeAddress: bookingType === 'home' ? homeAddress : undefined,
                doctorName: selectedDoc?.profiles?.full_name || 'Your Doctor',
                specialty: selectedSpecialty?.name || '',
                date: dateStr,
                time: selectedTime,
                type: bookingType,
                amount: amountToPay.toString(),
            };

            sendEmail('appointment_confirmation', notificationData);
            sendSms('appointment_confirmation', notificationData);

            if (paymentReference) {
                // Send payment receipt if payment was processed
                sendEmail('payment_receipt', notificationData);
                sendSms('payment_receipt', notificationData);
            }

            // Send notification email to the doctor
            if (selectedDoc?.profiles?.email) {
                const doctorNotification = {
                    doctorEmail: selectedDoc.profiles.email,
                    doctorPhone: selectedDoc.profiles.phone || '', // Assuming phone exists or is empty
                    doctorName: selectedDoc.profiles.full_name,
                    ...notificationData
                };
                sendEmail('doctor_booking_notification', doctorNotification);
                sendSms('doctor_booking_notification', doctorNotification);
            }
            
            if (isFertility && appt) {
                const formType = consultationFor === 'couple' ? 
                    (patientGender === 'female' ? 'female_fertility' : 'male_fertility') : 
                    (patientGender === 'female' ? 'female_fertility' : 'male_fertility');
                const partnerFormType = patientGender === 'female' ? 'male_fertility' : 'female_fertility';
                
                const { error: formErr } = await supabase
                    .from('medical_forms' as any)
                    .insert({
                        appointment_id: (appt as any).id,
                        patient_id: (user as any)?.uid || (user as any)?.id,
                        form_type: formType,
                        status: 'pending'
                    });
                    
                if (formErr) {
                    console.error("Failed to create medical form:", formErr);
                }

                if (consultationFor === 'couple' && partnerEmail) {
                    sendEmail('partner_fertility_form', {
                        partnerEmail,
                        formType: partnerFormType,
                        date: dateStr,
                    });
                    toast({
                        title: "Email Sent",
                        description: `A secure link to the partner's form has been sent to ${partnerEmail}`,
                    });
                }
            }
            
            if (currentStep < totalSteps) {
                setCurrentStep(curr => curr + 1);
                // Trigger dashboard re-fetch so the new appointment
                // appears instantly in the upcoming appointments box.
                onBookingSuccess?.();
            }
        } catch (error: any) {
            toast({
                title: "Booking Failed",
                description: error.message || "An error occurred while booking.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextClick = async () => {
        if (currentStep === 1) {
            const form = document.getElementById('personalForm') as HTMLFormElement;
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
        } else if (currentStep === 2) {
            const form = document.getElementById('medicalForm') as HTMLFormElement;
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
        } else if (currentStep === 3) {
            if (!selectedDate || !selectedTime) {
                toast({
                    title: "Selection Required",
                    description: "Please select both a date and an available time slot.",
                    variant: "destructive",
                });
                return;
            }
        } else if (currentStep === 4) {
            const form = document.getElementById('paymentForm') as HTMLFormElement;
            if (form && !form.checkValidity()) { form.reportValidity(); return; }
            
            if (!isSubmitting) {
                setIsSubmitting(true);
                if (amountToPay > 0) {
                    initializePayment({
                        onSuccess: (reference) => {
                            processBookingSuccess(reference);
                        },
                        onClose: () => {
                            setIsSubmitting(false);
                        }
                    });
                } else {
                    processBookingSuccess();
                }
            }
            return;
        } else if (currentStep === 5) {
            handleClose();
            return;
        }
        if (currentStep < totalSteps) setCurrentStep(curr => curr + 1);
    };

    const handlePrevClick = () => {
        if (currentStep > 1 && currentStep < 5) setCurrentStep(curr => curr - 1);
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setCurrentStep(1);
            setClinic("");
            setConsultationFor("");
            setPatientGender("");
            setPartnerEmail("");
            setPaymentMethod("mobile");
            setPreferredDoctor("");
            setSelectedDate(undefined);
            setSelectedTime('');
            setSecondaryPhone("");
            setHomeAddress("");
            setIsBookingForOther(false);
            setOtherPatientName("");
            setOtherPatientPhone("");
            setRelationship("");
        }, 300);
    };

    const isVisible = isOpen;

    const renderStepIndicator = (stepNumber: number, text: string) => {
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        let content = stepNumber;
        let circleClasses = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors duration-300 ring-4 ring-white dark:ring-slate-900";
        let textClasses = "text-xs sm:text-sm font-medium hidden sm:block";

        if (isCompleted) {
            content = <CheckCircle className="w-4 h-4" /> as any;
            circleClasses += " bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900";
            textClasses += " text-slate-900 dark:text-slate-100";
        } else if (isCurrent) {
            circleClasses += " bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900";
            textClasses += " text-slate-900 dark:text-slate-100";
        } else {
            circleClasses += " bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400";
            textClasses += " text-slate-400";
        }

        return (
            <div className="flex items-center gap-2 sm:gap-3 relative z-10 bg-white dark:bg-slate-900 px-2">
                <div className={circleClasses}>
                    {content}
                </div>
                <span className={textClasses}>
                    {text}
                </span>
            </div>
        );
    };

    return (
        <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-300 p-4 sm:p-6 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className={`bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl transform transition-transform duration-300 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 ${isVisible ? 'scale-100' : 'scale-95'}`}>

                {/* Progress & Title Header */}
                {(currentStep < 5) && (
                    <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white capitalize">
                                    {bookingType?.replace('-', ' ')} Booking
                                </h2>
                                <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
                                    Complete the form to book your appointment
                                </p>
                            </div>
                            <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 -mt-2 -mr-2 flex items-center justify-center">
                                <X className="w-5 h-5 stroke-[1.5px]" />
                            </button>
                        </div>

                        {/* 4-Step Progress Indicator */}
                        <div className="flex items-center w-full relative">
                            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 left-4 h-0.5 bg-slate-900 dark:bg-slate-100 z-0 transition-all duration-500"
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                            ></div>

                            <div className="pl-0">{renderStepIndicator(1, "Personal")}</div>
                            <div className="flex-1"></div>
                            <div>{renderStepIndicator(2, "Medical")}</div>
                            <div className="flex-1"></div>
                            <div>{renderStepIndicator(3, "Date")}</div>
                            <div className="flex-1"></div>
                            <div className="pr-0">{renderStepIndicator(4, "Payment")}</div>
                        </div>
                    </div>
                )}

                {/* Scrollable Flow Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 hide-scrollbar">

                    {/* STEP 1: PERSONAL INFO */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white mb-1">
                                    Personal Info Confirmation
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-normal text-sm sm:text-base">
                                    Please verify your contact details before proceeding.
                                </p>
                            </div>

                            <form id="personalForm" className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleNextClick(); }}>
                                {/* Booker's name */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Enter first name"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Enter last name"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Phone numbers */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Primary Phone <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={personalPhone}
                                            onChange={(e) => setPersonalPhone(e.target.value)}
                                            placeholder="e.g. 024XXXXXXX"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Secondary Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <input
                                            type="tel"
                                            value={secondaryPhone}
                                            onChange={(e) => setSecondaryPhone(e.target.value)}
                                            placeholder="e.g. 054XXXXXXX"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={personalEmail}
                                        onChange={(e) => setPersonalEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                    />
                                </div>

                                {/* Home address — only for home visits */}
                                {bookingType === 'home' && (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                            Home / GPS Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required={bookingType === 'home'}
                                            value={homeAddress}
                                            onChange={(e) => setHomeAddress(e.target.value)}
                                            placeholder="e.g. GH-123-4567 or 12 Accra Road, East Legon"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Enter your Ghana Post GPS code or full street address for the doctor's visit.</p>
                                    </div>
                                )}

                                {/* Booking for someone else toggle */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                                        <div
                                            onClick={() => setIsBookingForOther(v => !v)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                                                isBookingForOther
                                                    ? 'bg-slate-900 dark:bg-white'
                                                    : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow transition-transform duration-200 ${
                                                isBookingForOther ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            I am booking on behalf of someone else
                                        </span>
                                    </label>
                                </div>

                                {/* Fields shown if booking for someone else */}
                                {isBookingForOther && (
                                    <div className="space-y-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-fade-in">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Patient Details</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Patient's Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required={isBookingForOther}
                                                    value={otherPatientName}
                                                    onChange={(e) => setOtherPatientName(e.target.value)}
                                                    placeholder="Patient's full name"
                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Patient's Phone Number <span className="text-red-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    required={isBookingForOther}
                                                    value={otherPatientPhone}
                                                    onChange={(e) => setOtherPatientPhone(e.target.value)}
                                                    placeholder="e.g. 024XXXXXXX"
                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Your Relationship to Patient <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select
                                                        required={isBookingForOther}
                                                        value={relationship}
                                                        onChange={(e) => setRelationship(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm"
                                                    >
                                                        <option value="" disabled>Select relationship...</option>
                                                        <option value="spouse">Spouse / Partner</option>
                                                        <option value="parent">Parent</option>
                                                        <option value="child">Child</option>
                                                        <option value="sibling">Sibling</option>
                                                        <option value="guardian">Guardian / Caregiver</option>
                                                        <option value="friend">Friend</option>
                                                        <option value="colleague">Colleague</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="hidden"></button>
                            </form>
                        </div>
                    )}

                    {/* STEP 2: MEDICAL DETAILS */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white mb-1">
                                    Medical Details
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-normal text-sm sm:text-base">
                                    Help us match you with the right specialist by providing some context.
                                </p>
                            </div>

                            <form id="medicalForm" className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleNextClick(); }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                        Select Clinic <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={clinic}
                                            onChange={(e) => setClinic(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm"
                                        >
                                            <option value="" disabled>{loading ? 'Loading clinics...' : 'Select a clinic...'}</option>
                                            {specialties.map(specialty => (
                                                <option key={specialty.id} value={specialty.id}>
                                                    {specialty.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1.5 mt-1.5">
                                        <Info className="w-4 h-4" />
                                        Online consultations available for Gynecology and Fertility only.
                                    </p>
                                </div>

                                {isFertility && (
                                    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 animate-fade-in">
                                        <h4 className="text-base font-medium text-slate-900 dark:text-white tracking-tight">
                                            Fertility Consultation Details
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                                    Consultation For <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        required
                                                        value={consultationFor}
                                                        onChange={(e) => setConsultationFor(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm"
                                                    >
                                                        <option value="" disabled>Select...</option>
                                                        <option value="single">Single Person</option>
                                                        <option value="couple">Two People (Couple)</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                        <ChevronDown className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {consultationFor === 'single' && (
                                                <div className="space-y-2 animate-fade-in">
                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                                        Patient Gender <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            required
                                                            value={patientGender}
                                                            onChange={(e) => setPatientGender(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm"
                                                        >
                                                            <option value="" disabled>Select...</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                        </select>
                                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                            <ChevronDown className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {consultationFor === 'couple' && (
                                                <>
                                                    <div className="space-y-2 animate-fade-in">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                                            Primary Patient Gender <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                required
                                                                value={patientGender}
                                                                onChange={(e) => setPatientGender(e.target.value)}
                                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm"
                                                            >
                                                                <option value="" disabled>Select...</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                            </select>
                                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                                <ChevronDown className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 animate-fade-in sm:col-span-2">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                                            Partner's Email Address <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            required
                                                            placeholder="partner@example.com"
                                                            value={partnerEmail}
                                                            onChange={(e) => setPartnerEmail(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            We will send a separate fertility questionnaire to your partner.
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Questionnaires */}
                                        <div className="space-y-6">
                                            {(consultationFor === 'couple' || (consultationFor === 'single' && patientGender === 'male')) && (
                                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
                                                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-3 border-b border-slate-100 dark:border-slate-800 z-10 mb-4">
                                                        <h5 className="text-lg font-medium text-slate-900 dark:text-white tracking-tight">Male Questionnaire Placeholder</h5>
                                                        <p className="text-xs text-slate-500 mt-1">St. Gamaliel's Hospital - Quick Intake</p>
                                                    </div>
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs flex gap-2 items-start">
                                                        <Info className="w-5 h-5 shrink-0" />
                                                        <p>Please note: The full extensive questionnaire will be securely emailed to you to complete before your consultation.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {(consultationFor === 'couple' || (consultationFor === 'single' && patientGender === 'female')) && (
                                                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
                                                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-3 border-b border-slate-100 dark:border-slate-800 z-10 mb-4">
                                                        <h5 className="text-lg font-medium text-slate-900 dark:text-white tracking-tight">Female Questionnaire Placeholder</h5>
                                                        <p className="text-xs text-slate-500 mt-1">St. Gamaliel's Hospital - Quick Intake</p>
                                                    </div>
                                                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-xl text-xs flex gap-2 items-start">
                                                        <Info className="w-5 h-5 shrink-0" />
                                                        <p>Please note: The full extensive questionnaire will be securely emailed to you to complete before your consultation.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                        Preferred Doctor <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            disabled={!clinic}
                                            value={preferredDoctor}
                                            onChange={(e) => setPreferredDoctor(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all appearance-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="" disabled>{loading ? 'Loading doctors...' : 'Select a doctor...'}</option>
                                            {filteredDoctors.map(doc => (
                                                <option key={doc.user_id} value={doc.user_id}>
                                                    {doc.profiles?.full_name || 'Unknown Doctor'}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">
                                        Symptoms / Reason for Visit <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Please describe your symptoms..."
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all text-sm resize-none"
                                    ></textarea>
                                </div>
                                <button type="submit" className="hidden"></button>
                            </form>
                        </div>
                    )}

                    {/* STEP 3: DATE & TIME */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white mb-1">
                                    Select Date & Time
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-normal text-sm sm:text-base">
                                    Choose a slot that works best for you.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Calendar section */}
                                <div className="space-y-4 md:w-1/2 shrink-0">
                                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Select a Date
                                    </h4>
                                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex justify-center shadow-sm text-slate-900 dark:text-slate-100 relative min-h-[320px]">
                                        {loadingAvailability && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-2xl">
                                                <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                                    <div className="animate-spin text-slate-900 dark:text-white rounded-full h-8 w-8 border-b-2 border-current mb-2"></div>
                                                    <span className="text-sm font-medium">Checking calendar...</span>
                                                </div>
                                            </div>
                                        )}
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            className="rounded-md pointer-events-auto"
                                            classNames={{
                                                caption_label: "text-black dark:text-white font-semibold text-sm",
                                                nav_button: "border border-slate-200 dark:border-slate-800 bg-transparent p-1 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors",
                                                day: "h-9 w-9 p-0 font-normal text-slate-900 dark:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:opacity-100",
                                                day_disabled: "text-slate-400 dark:text-slate-600 opacity-50 pointer-events-none",
                                                day_outside: "day-outside text-slate-400 dark:text-slate-600 opacity-30",
                                                head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-9 font-normal text-[0.8rem]"
                                            }}
                                            disabled={(date) => {
                                                const today = startOfDay(new Date());
                                                if (isBefore(date, today)) return true;
                                                
                                                const dateStr = format(date, 'yyyy-MM-dd');
                                                const dayOfWeek = format(date, 'EEEE').toLowerCase();
                                                
                                                const hasSlot = availabilitySlots.some(slot => 
                                                    slot.date === dateStr || (!slot.date && slot.day_of_week === dayOfWeek)
                                                );
                                                return !hasSlot;
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Available times section */}
                                <div className="space-y-4 md:flex-1">
                                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Available Times
                                    </h4>
                                    
                                    {!selectedDate ? (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Select a date to view available times</p>
                                        </div>
                                    ) : availableTimes.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No available times on this date.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2 hide-scrollbar pb-2">
                                            {availableTimes.map(time => {
                                                const isChecked = selectedTime === time;
                                                return (
                                                    <label key={time} className="cursor-pointer block">
                                                        <input type="radio" value={time} checked={isChecked} onChange={() => setSelectedTime(time)} className="peer sr-only" />
                                                        <div className={`px-4 py-3 border rounded-xl text-center text-sm font-medium transition-all ${isChecked ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 ring-2 ring-slate-900/20 dark:ring-white/20' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950 shadow-sm'}`}>
                                                            {time}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PAYMENT */}
                    {currentStep === 4 && (
                        <div className="space-y-8 animate-fade-in flex flex-col">
                            <div>
                                <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white mb-1">
                                    {bookingType === 'hospital' ? 'Confirmation' : 'Confirmation & Payment'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-normal mt-4 text-sm sm:text-base px-2">
                                    Your appointment has been confirmed for {selectedDate ? format(selectedDate, 'MMMM do') : ''} at {selectedTime}. You'll receive a confirmation email shortly.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-slate-800">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Service</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{bookingType?.replace('-', ' ')} Booking</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-slate-800">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Date & Time</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {selectedDate ? format(selectedDate, 'MMM do, yyyy') : ''}{selectedTime ? `, ${selectedTime}` : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-base font-medium text-slate-900 dark:text-white">Total</span>
                                    <span className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">{amountToPay} GHS</span>
                                </div>
                            </div>

                            <form id="paymentForm" className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleNextClick(); }}>
                                {bookingType === 'hospital' ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl">
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            <strong>Note:</strong> Our admin team will contact you shortly to confirm the appointment. Payment will be completed at the hospital.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="cursor-pointer">
                                            <input type="radio" name="paymentMethod" value="mobile" checked={paymentMethod === 'mobile'} onChange={() => setPaymentMethod('mobile')} className="peer sr-only" />
                                            <div className={`px-4 py-3 border rounded-xl text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentMethod === 'mobile' ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                                <Smartphone className="w-5 h-5" /> Mobile Money
                                            </div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input type="radio" name="paymentMethod" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} className="peer sr-only" />
                                            <div className={`px-4 py-3 border rounded-xl text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${paymentMethod === 'bank' ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                                <CreditCard className="w-5 h-5" /> Bank Payment
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {paymentMethod === 'mobile' ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Mobile Money Number</label>
                                            <input type="tel" required placeholder="e.g. 024XXXXXXX" pattern="[0-9]*" onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Network Provider</label>
                                            <select required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-sm">
                                                <option value="" disabled selected>Select network...</option>
                                                <option value="mtn">MTN</option>
                                                <option value="vodafone">Telecel / Vodafone</option>
                                                <option value="airteltigo">AT / AirtelTigo</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 animate-fade-in">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block tracking-tight">Card Information</label>
                                        <input type="text" required placeholder="Card Number" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-sm mb-3" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" required placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-sm" />
                                            <input type="text" required placeholder="CVC" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-all text-sm" />
                                        </div>
                                    </div>
                                )}
                                    </>
                                )}
                                <button type="submit" className="hidden"></button>
                            </form>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {currentStep === 5 && (
                        <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center animate-fade-in px-4">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white mb-2">
                                Payment Successful!
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-normal text-sm max-w-sm mx-auto mb-8">
                                Your appointment has been scheduled. Below is your transaction receipt.
                            </p>

                            <div className="w-full max-w-sm mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left relative overflow-hidden mb-6">
                                <div className="absolute -top-3 -left-3 w-6 h-6 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 z-10"></div>
                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 z-10"></div>
                                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 z-10"></div>
                                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 z-10"></div>

                                <div className="text-center mb-6 pb-6 border-b border-dashed border-slate-300 dark:border-slate-700 relative z-0">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Receipt</p>
                                    <p className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{amountToPay} GHS</p>
                                </div>

                                <div className="space-y-4 mb-8 relative z-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Service</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{bookingType?.replace('-', ' ')} Booking</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Date & Time</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {selectedDate ? format(selectedDate, 'MMM do, yyyy') : ''}{selectedTime ? `, ${selectedTime}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Patient</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{patientName || "James Bond"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Txn ID</span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">#TXN-84920</span>
                                    </div>
                                </div>

                                <button type="button" className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 relative z-0">
                                    <Download className="w-5 h-5" />
                                    Download Receipt
                                </button>
                            </div>

                            <button type="button" onClick={handleClose} className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                Back to Dashboard
                            </button>
                        </div>
                    )}

                </div>

                {/* Action Footer */}
                {currentStep < 5 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0 sticky bottom-0 z-20">
                        <button
                            type="button"
                            onClick={handlePrevClick}
                            className={`px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center ${currentStep === 1 ? 'invisible' : ''}`}
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleNextClick}
                            disabled={isSubmitting}
                            className={`px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2 active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span>
                                {isSubmitting ? 'Processing...' :
                                 currentStep === 1 ? 'Next: Medical Details' :
                                    currentStep === 2 ? 'Next: Select Date' :
                                        currentStep === 3 ? (bookingType === 'hospital' ? 'Next: Confirmation' : 'Next: Payment') : 
                                            (bookingType === 'hospital' ? 'Submit Request' : 'Pay & Confirm')}
                            </span>
                            {currentStep === 4 ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
