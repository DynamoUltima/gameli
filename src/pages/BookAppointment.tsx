import { useEffect, useMemo, useState, useCallback } from "react";
import { sendEmail } from "@/lib/emailService";
import { sendSms } from "@/lib/smsService";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorSchedules } from "@/hooks/useDoctorSchedules";
import { useDoctors } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check, Video, Hospital, Home, CreditCard, Smartphone, Clock } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, isToday, startOfDay } from "date-fns";
import {
  NATIONAL_ID_TYPES,
  type NationalIdRecord,
  type NationalIdType,
  labelForNationalIdType,
  nationalIdRequiresBack,
  uploadNationalId,
  saveNationalIdToProfile,
  fetchNationalId,
  validateIdImage,
} from "@/lib/nationalIdService";

const BookAppointment = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth(true); // Require authentication

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>(""); // ISO string
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [generalAvailability, setGeneralAvailability] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  // Authoritative phone from the DB — always used for SMS, not the form field
  const [dbPhone, setDbPhone] = useState<string>("");

  // Use the doctors hook for data
  const { doctors, specialties, loading: doctorsLoading } = useDoctors();

  // Initialize the doctor schedules hook
  const { getAvailableSlots, checkAvailability } = useDoctorSchedules();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    symptoms: "",
    clinic: "",
    doctor: "",
    patientType: "new",
    location: "",
    paymentMethod: "momo",
    bookAsCouple: false,
    partnerEmail: ""
  });

  // National ID of the patient — required security verification for home visits.
  // Saved to the profile and reused; only prompt for upload when none is saved (or they replace it).
  const [savedNationalId, setSavedNationalId] = useState<NationalIdRecord | null>(null);
  const [replacingId, setReplacingId] = useState(false);
  const [idType, setIdType] = useState<NationalIdType>("ghana_card");
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>("");
  const [idBackPreview, setIdBackPreview] = useState<string>("");

  const hasSavedId = !!savedNationalId?.national_id_front_url;
  const showIdUploadForm = !hasSavedId || replacingId;
  const idRequiresBack = nationalIdRequiresBack(idType);
  // Whether the home-visit ID requirement is satisfied for this booking.
  const idRequirementMet =
    (hasSavedId && !replacingId) ||
    (!!idFrontFile && (!idRequiresBack || !!idBackFile));

  const handleIdFileChange = (
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFile(null);
      setPreview("");
      return;
    }
    const err = validateIdImage(file);
    if (err) {
      toast.error(err);
      e.target.value = "";
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Prefill personal info from profiles
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email, date_of_birth, gender")
        .eq("id", user.uid)
        .maybeSingle();
      if (profile) {
        // Store DB phone separately — this is the authoritative number for SMS
        if (profile.phone) setDbPhone(profile.phone);
        setFormData((prev) => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
          age: profile.date_of_birth ? calculateAge(profile.date_of_birth) : prev.age,
          gender: profile.gender || prev.gender,
        }));
      }

      // Load any saved national ID so home-visit bookings can reuse it
      const savedId = await fetchNationalId(user.uid);
      setSavedNationalId(savedId);
      if (savedId?.national_id_type) setIdType(savedId.national_id_type);
    };
    loadProfile();
  }, [user?.uid]);

  const doctorsForClinic = useMemo(() => {
    if (!formData.clinic) return [];
    return doctors
      .filter(doc => (doc.specialty_id === formData.clinic || doc.specialties?.some(s => s.id === formData.clinic)) && doc.available)
      .map(doc => ({
        id: doc.user_id,
        full_name: doc.profiles?.full_name || "Unknown Doctor"
      }));
  }, [formData.clinic, doctors]);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDate || !formData.doctor) {
        setAvailableSlots([]);
        setSelectedTime("");
        return;
      }

      setIsLoadingSlots(true);
      try {
        console.log('Loading slots for doctor:', formData.doctor, 'date:', selectedDate);
        const slots = await getAvailableSlots(formData.doctor, selectedDate);
        console.log('Received slots:', slots);
        setAvailableSlots(slots);

        // Auto-select the first available slot if none selected
        if (slots.length > 0) {
          // Only auto-select if no time is currently selected
          if (!selectedTime) {
            setSelectedTime(slots[0]);
          }
        } else {
          setSelectedTime("");
          // Only show warning if we actually tried to load slots
          if (selectedDate && formData.doctor) {
            toast.warning('No available time slots for the selected date. Please try another date or doctor.');
          }
        }
      } catch (error) {
        console.error('Error loading time slots:', error);
        toast.error('Failed to load available time slots');
        setAvailableSlots([]);
        setSelectedTime("");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [selectedDate, formData.doctor, getAvailableSlots]);

  useEffect(() => {
    const fetchGeneralAvailability = async () => {
      if (!formData.doctor) {
        setGeneralAvailability([]);
        return;
      }
      setIsLoadingCalendar(true);
      try {
        const { data, error } = await supabase
          .from('doctor_availability')
          .select('date, day_of_week')
          .eq('doctor_id', formData.doctor);
        if (error) throw error;
        setGeneralAvailability(data || []);
      } catch (error) {
        console.error('Error fetching general availability:', error);
      } finally {
        setIsLoadingCalendar(false);
      }
    };
    fetchGeneralAvailability();
  }, [formData.doctor]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      setSelectedTime("");
      return;
    }

    // Normalize the date to midnight to avoid timezone issues
    const normalizedDate = new Date(date);
    normalizedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone shifts

    // If selecting today's date, check if there are any slots left
    if (isToday(normalizedDate)) {
      const now = new Date();
      const currentHour = now.getHours();

      // If it's late in the day (after 4 PM), show info but still allow selection
      // The slot filtering will handle removing past times
      if (currentHour >= 16) {
        toast.info('Limited slots available for today. Past times will be automatically filtered.');
      }
    }

    // Set the normalized date
    setSelectedDate(normalizedDate);
    setSelectedTime(""); // Reset time when date changes
  };

  // Format time slots for display
  const formattedTimeSlots = useMemo(() => {
    return availableSlots.map(slot => ({
      iso: slot,
      display: format(new Date(slot), 'h:mm a')
    }));
  }, [availableSlots]);

  // Show loading while checking auth - AFTER all hooks are declared
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const appointmentTypes = {
    online: { name: "Online Consultation", icon: Video, color: "primary", price: 45 },
    hospital: { name: "Hospital Visit", icon: Hospital, color: "accent", price: 144 },
    home: { name: "Home Visit", icon: Home, color: "secondary", price: null }
  };

  const currentType = appointmentTypes[type as keyof typeof appointmentTypes];
  const Icon = currentType?.icon;

  const clinics = [
    "Gynecology",
    "Fertility",
    "Cardiology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology"
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.phone || !formData.email)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step === 2 && (!formData.clinic || !formData.symptoms)) {
      toast.error("Please select a clinic and describe your symptoms");
      return;
    }
    if (step === 2 && !formData.doctor) {
      toast.error("Please select a doctor to see their availability");
      return;
    }
    if (step === 2 && type === "home" && !idRequirementMet) {
      toast.error(
        idRequiresBack
          ? "Please upload the front and back of the patient's Ghana Card for the home visit."
          : "Please upload the patient's national ID for the home visit."
      );
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      toast.error("Please select an appointment date and time");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      // Combine date and time into ISO timestamp
      let scheduledAt: string | null = null;
      if (selectedDate && selectedTime) {
        // Parse "09:00 AM" and combine with selectedDate
        const timeMatch = selectedTime.match(/(\d+):(\d+)\s(.*)/);
        if (timeMatch) {
          let [_, hoursStr, minutesStr, modifier] = timeMatch;
          let hours = parseInt(hoursStr, 10);
          let minutes = parseInt(minutesStr, 10);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          
          const dateObj = new Date(selectedDate);
          dateObj.setHours(hours, minutes, 0, 0);
          scheduledAt = dateObj.toISOString();
        } else {
           // Fallback if it is already ISO
           scheduledAt = selectedTime;
        }
      }

      console.log({ '-------type---': type })

      // Resolve doctor_id if provided (doctor select now returns profile id/user id)
      const doctorId: string | null = formData.doctor || null;

      // National ID for home visits (security verification of the patient).
      // If a new ID was uploaded, save it to the profile so it's reused next time;
      // otherwise reuse the ID already saved on the profile.
      let nationalIdFrontUrl: string | null = savedNationalId?.national_id_front_url || null;
      if (type === "home" && idFrontFile) {
        const uploaded = await uploadNationalId({
          uid: user?.uid || "anon",
          type: idType,
          frontFile: idFrontFile,
          backFile: idBackFile,
        });
        await saveNationalIdToProfile(user?.uid || "anon", {
          national_id_type: idType,
          national_id_front_url: uploaded.national_id_front_url,
          national_id_back_url: uploaded.national_id_back_url,
        });
        nationalIdFrontUrl = uploaded.national_id_front_url;
      }
      // Snapshot the front image onto the appointment (kept in the legacy ghana_card_* columns
      // for backward compatibility with existing admin/doctor views and old records).
      const ghanaCardUrl = type === "home" ? nationalIdFrontUrl : null;

      // Insert appointment
      const { data: appt, error: apptErr } = await supabase
        .from("appointments" as any)
        .insert({
          patient_id: user?.uid,
          doctor_id: doctorId,
          clinic: (specialties.find(s => s.id === formData.clinic)?.name) || null,
          specialty_id: formData.clinic || null,
          type: type,
          scheduled_at: scheduledAt ?? new Date().toISOString(),
          created_at: new Date().toISOString(),
          symptoms: formData.symptoms || null,
          location: formData.location || null,
          status: type === "hospital" ? "pending" : "confirmed",
          payment_status: "unpaid",
          ghana_card_url: ghanaCardUrl,
          ghana_card_holder: type === "home" ? (formData.name || null) : null,
        })
        .select("id, doctor_id, scheduled_at")
        .maybeSingle();

      if (apptErr) throw apptErr;

      // Send appointment confirmation email to patient
      const selectedDoc = doctors.find(d => d.user_id === formData.doctor);
      const dateStr = selectedDate ? format(selectedDate, 'MMMM do, yyyy') : '';
      const timeStr = selectedTime ? format(new Date(selectedTime), 'h:mm a') : '';
      
      const notificationData = {
        patientEmail: formData.email,
        // Use the DB phone as the primary SMS target, fall back to form phone
        patientPhone: dbPhone || formData.phone,
        patientName: formData.name,
        doctorName: selectedDoc?.profiles?.full_name || 'Your Doctor',
        specialty: specialties.find(s => s.id === formData.clinic)?.name || '',
        date: dateStr,
        time: timeStr,
        type: type,
        amount: type === "online" ? "150.00" : "200.00",
      };

      sendEmail('appointment_confirmation', notificationData);
      sendSms('appointment_confirmation', notificationData);

      // Send notification email to the doctor
      if (selectedDoc?.profiles?.email) {
        const doctorNotification = {
          doctorEmail: selectedDoc.profiles.email,
          doctorPhone: selectedDoc.profiles.phone || '',
          doctorName: selectedDoc.profiles.full_name,
          ...notificationData
        };
        sendEmail('doctor_booking_notification', doctorNotification);
        sendSms('doctor_booking_notification', doctorNotification);
      }
      
      const clinicName = specialties.find(s => s.id === formData.clinic)?.name || '';
      if (clinicName.toLowerCase().includes('fertility')) {
        const patientIsMale = formData.gender?.toLowerCase() === 'male';
        const primaryFormType = patientIsMale ? 'male_fertility' : 'female_fertility';
        const partnerFormType = patientIsMale ? 'female_fertility' : 'male_fertility';

        // For a couple, create BOTH questionnaires (male + female) so both
        // partners' forms show on the dashboard and to the doctor/admin.
        const formTypesToCreate = formData.bookAsCouple
          ? [primaryFormType, partnerFormType]
          : [primaryFormType];

        const { error: formErr } = await supabase
          .from("medical_forms" as any)
          .insert(formTypesToCreate.map((ft) => ({
            appointment_id: (appt as any).id,
            patient_id: user?.uid,
            form_type: ft,
            status: 'pending',
            created_at: new Date().toISOString()
          })));
          
        if (formErr) {
          console.error("Failed to create medical form req:", formErr);
        } else {
          // Notify the patient about their fertility intake form via email and SMS
          const formLink = `${window.location.origin}/dashboard/patient?openForm=1`;
          const fertilityFormData = {
            patientEmail: formData.email,
            patientPhone: dbPhone || formData.phone,
            patientName: formData.name,
            formLink,
            date: dateStr,
          };
          sendEmail('fertility_form_link', fertilityFormData);
          sendSms('fertility_form_link', fertilityFormData);
        }

        if (formData.bookAsCouple && formData.partnerEmail) {
          sendEmail('partner_fertility_form', {
            partnerEmail: formData.partnerEmail,
            formType: partnerFormType,
            date: selectedDate ? format(selectedDate, 'MMMM do, yyyy') : '',
          });
          toast.success(`A secure link to the partner's form has been sent to ${formData.partnerEmail}`);
        }
      }

      console.log({
        homeVisitDebug: {
          patient_id: user?.uid,
          doctor_id: doctorId,
          clinic: (specialties.find(s => s.id === formData.clinic)?.name) || null,
          specialty_id: formData.clinic || null,
          type: type,
          scheduled_at: scheduledAt ?? new Date().toISOString(),
          symptoms: formData.symptoms || null,
          location: formData.location || null,
          patientType: formData.patientType,
          paymentMethod: formData.paymentMethod,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        rawFormData: formData,
      });

      // Schedule entry is auto-created in DB via trigger

      if (type === "online") {
        const selectedSpecialty = specialties.find(s => s.id === formData.clinic);
        const amountToPay = selectedSpecialty?.cost || currentType.price;
        navigate(`/payment?type=online&amount=${amountToPay}&appointmentId=${(appt as any)?.id ?? ""}`);
      } else {
        toast.success("Appointment request submitted! Our admin will contact you.");
        // setTimeout(() => navigate("/"), 1200);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit appointment");
    }
  };

  const steps = 4;

  const selectedSpecialtyObj = specialties.find(s => s.id === formData.clinic);
  const displayAmount = selectedSpecialtyObj?.cost || currentType.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link>
            </Button>
            <ThemeSwitcher />
          </div>

          <div className="flex items-center gap-4">
            {Icon && (
              <div className={`w-16 h-16 rounded-2xl bg-${currentType.color}/10 flex items-center justify-center`}>
                <Icon className={`w-8 h-8 text-${currentType.color}`} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{currentType?.name}</h1>
              <p className="text-muted-foreground">Complete the form to book your appointment</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: steps }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step > index + 1 ? "bg-success text-success-foreground" :
                  step === index + 1 ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                  {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-muted-foreground">
                  {index === 0 && "Personal Info"}
                  {index === 1 && "Medical Details"}
                  {index === 2 && "Select Date"}
                  {index === 3 && (type === "online" ? "Payment" : "Confirmation")}
                </span>
              </div>
              {index < steps - 1 && (
                <div className={`h-1 flex-1 mx-2 ${step > index + 1 ? "bg-success" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Personal Information"}
              {step === 2 && "Medical Information"}
              {step === 3 && "Select Date & Time"}
              {step === 4 && (type === "online" ? "Payment Method" : "Review & Confirm")}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Help us understand your medical needs"}
              {step === 3 && "Choose your preferred appointment slot"}
              {step === 4 && (type === "online" ? "Choose how you'd like to pay" : "Review your booking details")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="text"
                      placeholder="Age calculated from profile"
                      value={formData.age ? `${formData.age} years` : ""}
                      readOnly
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    {!formData.age && (
                      <p className="text-xs text-muted-foreground">
                        Update your date of birth in your profile to auto-fill age
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      type="text"
                      placeholder="Gender from profile"
                      value={formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : ""}
                      readOnly
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    {!formData.gender && (
                      <p className="text-xs text-muted-foreground">
                        Update your gender in your profile to auto-fill
                      </p>
                    )}
                  </div>
                </div>

                {/* {type !== "online" && (
                  <div className="space-y-2">
                    <Label>Patient Type</Label>
                    <RadioGroup value={formData.patientType} onValueChange={(value) => setFormData({...formData, patientType: value})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new" className="font-normal cursor-pointer">New Patient (144 GHS)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="followup" id="followup" />
                        <Label htmlFor="followup" className="font-normal cursor-pointer">Follow-up Visit (104 GHS)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )} */}
              </div>
            )}

            {/* Step 2: Medical Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic">Select Clinic *</Label>
                  <Select value={formData.clinic} onValueChange={(value) => setFormData({ ...formData, clinic: value, doctor: "" })}>
                    <SelectTrigger id="clinic">
                      <SelectValue placeholder="Choose a clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {type === "online" && (
                    <p className="text-sm text-muted-foreground">
                      Online consultations available for Gynecology and Fertility only
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">
                    Preferred Doctor *
                  </Label>
                  <Select
                    value={formData.doctor}
                    onValueChange={(value) => setFormData({ ...formData, doctor: value })}
                    disabled={!formData.clinic}
                  >
                    <SelectTrigger id="doctor">
                      <SelectValue
                        placeholder={!formData.clinic
                          ? "Select a clinic first"
                          : (doctorsForClinic.length ? "Choose a doctor" : "No doctors available")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsForClinic.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.clinic && doctorsForClinic.length === 0 && (
                    <p className="text-sm text-muted-foreground">No doctors available for this clinic yet.</p>
                  )}
                  <p className="text-sm text-primary">
                    Required to show available time slots
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms / Reason for Visit *</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Please describe your symptoms or reason for consultation..."
                    className="min-h-32"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  />
                </div>

                {type === "home" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Home Address *</Label>
                    <Textarea
                      id="location"
                      placeholder="Enter your complete address for home visit..."
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                )}

                {type === "home" && (
                  <div className="space-y-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <Label className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600" />
                      Patient's National ID *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      For the safety of our visiting staff, we need a valid national ID
                      (Ghana Card, Voter's ID or Driving License) for the person receiving the home visit.
                    </p>

                    {/* Reuse the ID already saved on the patient's profile */}
                    {hasSavedId && !replacingId && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-md bg-white border border-amber-200">
                          {savedNationalId?.national_id_front_url && (
                            <img
                              src={savedNationalId.national_id_front_url}
                              alt="Saved ID"
                              className="h-14 w-20 rounded object-cover border"
                            />
                          )}
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{labelForNationalIdType(savedNationalId?.national_id_type)} on file</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              Status: {savedNationalId?.national_id_status || "pending"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplacingId(true)}
                          className="text-xs font-medium text-amber-700 underline"
                        >
                          Upload a different ID
                        </button>
                      </div>
                    )}

                    {/* Upload / replace form */}
                    {showIdUploadForm && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">ID type</Label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value as NationalIdType)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {NATIONAL_ID_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">{idRequiresBack ? "Front of card" : "ID image"}</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIdFileChange(setIdFrontFile, setIdFrontPreview)}
                            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer cursor-pointer"
                          />
                          {idFrontPreview && (
                            <img src={idFrontPreview} alt="ID front preview" className="mt-2 max-h-40 rounded-md border object-contain" />
                          )}
                        </div>

                        {idRequiresBack && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Back of card</Label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdFileChange(setIdBackFile, setIdBackPreview)}
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer cursor-pointer"
                            />
                            {idBackPreview && (
                              <img src={idBackPreview} alt="ID back preview" className="mt-2 max-h-40 rounded-md border object-contain" />
                            )}
                          </div>
                        )}

                        {hasSavedId && (
                          <button
                            type="button"
                            onClick={() => { setReplacingId(false); setIdFrontFile(null); setIdBackFile(null); setIdFrontPreview(""); setIdBackPreview(""); }}
                            className="text-xs font-medium text-muted-foreground underline"
                          >
                            Cancel — use saved ID
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date Selection */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex justify-center relative min-h-[320px]">
                  {isLoadingCalendar && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md border">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <span className="text-sm font-medium">Checking doctor's calendar...</span>
                      </div>
                    </div>
                  )}
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                    disabled={(date) => {
                      const today = startOfDay(new Date());
                      if (date < today) return true;
                      
                      if (!formData.doctor || generalAvailability.length === 0) return true;
                      
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayOfWeek = format(date, 'EEEE').toLowerCase();
                      
                      const hasSlot = generalAvailability.some(slot => 
                        slot.date === dateStr || (!slot.date && slot.day_of_week === dayOfWeek)
                      );
                      return !hasSlot;
                    }}
                  />
                </div>
                {selectedDate && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected Date</p>
                    <p className="font-semibold text-lg">{selectedDate.toLocaleDateString('en-US')}</p>
                  </div>
                )}
                <div className="mt-4">
                  {!formData.doctor ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="font-medium">Select a doctor first</p>
                      <p className="text-sm">Go back to Step 2 and choose a preferred doctor</p>
                    </div>
                  ) : isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading available slots...</span>
                    </div>
                  ) : formattedTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {formattedTimeSlots.map(({ iso, display }) => (
                        <Button
                          key={iso}
                          type="button"
                          variant={selectedTime === iso ? "default" : "outline"}
                          onClick={() => setSelectedTime(iso)}
                          className="py-2"
                        >
                          {display}
                        </Button>
                      ))}
                    </div>
                  ) : selectedDate && formData.doctor ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p className="font-medium">No available time slots for this date.</p>
                      <p className="text-sm mt-2">The doctor may not work on this day or all slots are booked.</p>
                      <p className="text-sm">Please select another date or try a different doctor.</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Select a date to see available time slots</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Payment Method (Online) or Confirmation (Hospital/Home) */}
            {step === 4 && type === "online" && (
              <div className="space-y-4">
                <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <div className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-muted-foreground">MTN, Vodafone, AirtelTigo</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Debit Card</p>
                        <p className="text-sm text-muted-foreground">Visa, MasterCard</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{displayAmount} GHS</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">{displayAmount} GHS</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && type !== "online" && (
              <div className="space-y-4">
                <div className="p-6 bg-muted rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clinic:</span>
                    <span className="font-medium capitalize">{specialties.find(s => s.id === formData.clinic)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium">
                        {selectedDate ? format(selectedDate, 'MMM do, yyyy') : ''}{selectedTime ? `, ${format(new Date(selectedTime), 'h:mm a')}` : ''}
                    </span>
                  </div>
                </div>
                <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> Our admin team will contact you shortly to confirm the appointment. Payment will be completed at the hospital.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {step < steps ? (
                <Button onClick={handleNext} className="flex-1">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1">
                  {type === "online" ? "Proceed to Payment" : "Submit Request"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
