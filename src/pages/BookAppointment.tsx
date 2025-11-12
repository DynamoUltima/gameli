import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorSchedules } from "@/hooks/useDoctorSchedules";
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
import { format, addMinutes, isToday } from "date-fns";

const BookAppointment = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth(true); // Require authentication
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>(""); // ISO string
  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([]);
  const [doctorsForClinic, setDoctorsForClinic] = useState<Array<{ id: string; full_name: string }>>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
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
    paymentMethod: "momo"
  });

  // Prefill personal info from profiles
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setFormData((prev) => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
        }));
      }
    };
    const loadSpecialties = async () => {
      const { data } = await supabase
        .from("specialties")
        .select("id, name")
        .order("name");
      setSpecialties((data || []).map(s => ({ id: s.id, name: s.name })));
    };
    loadProfile();
    loadSpecialties();
  }, [user?.id]);

  useEffect(() => {
    const loadDoctorsByClinic = async () => {
      setDoctorsForClinic([]);
      if (!formData.clinic) return;
      // clinic now holds specialty_id
      const { data: doctors } = await supabase
        .from("doctors")
        .select("user_id")
        .eq("specialty_id", formData.clinic);
      const doctorUserIds = (doctors || []).map(d => d.user_id);
      if (doctorUserIds.length === 0) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", doctorUserIds);
      setDoctorsForClinic((profiles || []).map(p => ({ id: p.id, full_name: p.full_name })));
    };
    loadDoctorsByClinic();
    console.log({'type':type})
  }, [formData.clinic]);

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
    // Remove selectedTime from dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, formData.doctor, getAvailableSlots]);

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
    if (step === 2 && type === "online" && !formData.doctor) {
      toast.error("Please select a doctor for online appointments");
      return;
    }
    if (step === 3 && type === "online" && (!selectedDate || !selectedTime)) {
      toast.error("Please select an appointment date and time");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      // Combine date and time into ISO timestamp
      let scheduledAt: string | null = null;
      if (type === "online" && selectedDate && selectedTime) {
        // selectedTime is already an ISO string from getAvailableSlots
        scheduledAt = selectedTime;
      }

      console.log({'-------type---':type})

      // Resolve doctor_id if provided (doctor select now returns profile id/user id)
      const doctorId: string | null = formData.doctor || null;

      // Insert appointment
      const { data: appt, error: apptErr } = await supabase
        .from("appointments" as any)
        .insert({
          patient_id: user?.id,
          doctor_id: doctorId,
          clinic: (specialties.find(s => s.id === formData.clinic)?.name) || null,
          specialty_id: formData.clinic || null,
          type: type,
          scheduled_at: scheduledAt ?? new Date().toISOString(),
          symptoms: formData.symptoms || null,
          location: formData.location || null,
          status: type === "online" ? "pending" : "pending",
          payment_status: type === "online" ? "unpaid" : "unpaid",
        })
        .select("id, doctor_id, scheduled_at")
        .maybeSingle();

      if (apptErr) throw apptErr;
   console.log({
          homeVisitDebug: {
            patient_id: user?.id,
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
      console.log({'appointment':appt})
      console.log({'appointmenttErr':apptErr})

      // Schedule entry is auto-created in DB via trigger

      if (type === "online") {
        navigate(`/payment?type=online&amount=${currentType.price}&appointmentId=${(appt as any)?.id ?? ""}`);
      } else {

        console.log({'formData home visit':formData})

        const { data: appt, error: apptErr } = await supabase
        .from("appointments" as any)
        .insert({
          patient_id: user?.id,
          doctor_id: doctorId,
          clinic: (specialties.find(s => s.id === formData.clinic)?.name) || null,
          specialty_id: formData.clinic || null,
          type: type,
          scheduled_at: scheduledAt ?? new Date().toISOString(),
          symptoms: formData.symptoms || null,
          location: formData.location || null,
          status: type === "home" ? "pending" : "pending",
          payment_status: type === "home" ? "unpaid" : "unpaid",
        })
        .select("id, doctor_id, scheduled_at")
        .maybeSingle();

        

       console.log({'formData home visit':formData})

        console.log({'appt home visit':appt})
        console.log({'apptErr home visit':apptErr})
      


        toast.success("Appointment request submitted! Our admin will contact you.");
        // setTimeout(() => navigate("/"), 1200);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit appointment");
    }
  };

  const steps = type === "online" ? 4 : 3;

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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step > index + 1 ? "bg-success text-success-foreground" :
                  step === index + 1 ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-muted-foreground">
                  {index === 0 && "Personal Info"}
                  {index === 1 && "Medical Details"}
                  {index === 2 && type === "online" ? "Select Date" : "Confirmation"}
                  {index === 3 && "Payment"}
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
              {step === 3 && (type === "online" ? "Select Date & Time" : "Review & Confirm")}
              {step === 4 && "Payment Method"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Help us understand your medical needs"}
              {step === 3 && (type === "online" ? "Choose your preferred appointment slot" : "Review your booking details")}
              {step === 4 && "Choose how you'd like to pay"}
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
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {type !== "online" && (
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
                )}
              </div>
            )}

            {/* Step 2: Medical Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic">Select Clinic *</Label>
                  <Select value={formData.clinic} onValueChange={(value) => setFormData({...formData, clinic: value, doctor: ""})}>
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
                    Preferred Doctor {type === "online" ? "*" : "(Optional)"}
                  </Label>
                  <Select
                    value={formData.doctor}
                    onValueChange={(value) => setFormData({...formData, doctor: value})}
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
                  {type === "online" && (
                    <p className="text-sm text-primary">
                      Required for online appointments to show available time slots
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms / Reason for Visit *</Label>
                  <Textarea 
                    id="symptoms" 
                    placeholder="Please describe your symptoms or reason for consultation..."
                    className="min-h-32"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  />
                </div>

                {type === "home" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Home Address *</Label>
                    <Textarea 
                      id="location" 
                      placeholder="Enter your complete address for home visit..."
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Date Selection (Online) or Confirmation */}
            {step === 3 && type === "online" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                {selectedDate && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected Date</p>
                    <p className="font-semibold text-lg">{selectedDate.toLocaleDateString()}</p>
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

            {step === 3 && type !== "online" && (
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
                  {type === "hospital" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{formData.patientType === "new" ? "144" : "104"} GHS</span>
                    </div>
                  )}
                </div>
                <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> Our admin team will contact you shortly to confirm the appointment date and time.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Payment Method (Online only) */}
            {step === 4 && (
              <div className="space-y-4">
                <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                  <div className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-warning" />
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
                    <span className="text-muted-foreground">Consultation Fee:</span>
                    <span className="font-medium">45 GHS</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">45 GHS</span>
                  </div>
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
