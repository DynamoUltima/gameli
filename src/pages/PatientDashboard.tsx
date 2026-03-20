import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PatientNav } from "@/components/patient-dashboard/PatientNav";
import { PatientQuickActions } from "@/components/patient-dashboard/PatientQuickActions";
import { PatientAppointments } from "@/components/patient-dashboard/PatientAppointments";
import { PatientProfileCard } from "@/components/patient-dashboard/PatientProfileCard";
import { PatientBookingModal } from "@/components/patient-dashboard/PatientBookingModal";
import { PatientAppointmentHistoryModal } from "@/components/patient-dashboard/PatientAppointmentHistoryModal";
import { FertilityIntakeForm } from "@/components/patient-dashboard/FertilityIntakeForm";

import { CheckCircle, XCircle, AlertCircle, Bell, ClipboardList, Calendar } from "lucide-react";
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  time: string;
  appointment?: any;
  formId?: string;
  formType?: string;
  formStatus?: string;
  isForm?: boolean;
}

const PatientDashboard = () => {
  const { user, signOut } = useAuth(true);
  const [fullName, setFullName] = useState<string>("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile data state
  const [profileData, setProfileData] = useState({
    phone: "",
    gender: "",
    date_of_birth: "",
    hospital_card_id: ""
  });

  // Edit profile dialog state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    phone: "",
    gender: "",
    date_of_birth: ""
  });

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState<string | null>(null);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form State
  const [activeView, setActiveView] = useState<'dashboard' | 'form'>('dashboard');
  const [activeFormDetails, setActiveFormDetails] = useState<{id: string, type: string} | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleOpenBooking = (type: string = 'online') => {
    setBookingType(type);
    setIsBookingModalOpen(true);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, gender, date_of_birth, hospital_card_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");
        setProfileData({
          phone: profile.phone ?? "",
          gender: profile.gender ?? "",
          date_of_birth: profile.date_of_birth ?? "",
          hospital_card_id: profile.hospital_card_id ?? ""
        });
      }
    };
    loadProfile();
  }, [user?.id]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Use start of today so appointments booked for today are always included.
      // Also include pending/confirmed (pending/confirmed) appointments regardless of
      // exact time, in case the stored timestamp is slightly behind the current moment.
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Filter upcoming vs past appointments
      const upcoming = (appointmentsData || []).filter(apt => {
        const isPendingOrConfirmed = apt.status === 'pending' || apt.status === 'confirmed';
        const isFromToday = new Date(apt.scheduled_at) >= startOfToday;
        return (isPendingOrConfirmed || isFromToday) && apt.status !== 'cancelled' && apt.status !== 'completed';
      });

      // Sort upcoming in descending order (most recently booked first)
      upcoming.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const past = (appointmentsData || []).filter(apt => {
        const isPendingOrConfirmed = apt.status === 'pending' || apt.status === 'confirmed';
        const isFromToday = new Date(apt.scheduled_at) >= startOfToday;
        return apt.status === 'completed' || apt.status === 'cancelled' || (!isPendingOrConfirmed && !isFromToday);
      });

      const enrichedUpcoming = await Promise.all(
        upcoming.map(async (apt) => {
          const { data: doctorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', apt.doctor_id)
            .maybeSingle();

          const { data: specialty } = await supabase
            .from('specialties')
            .select('name')
            .eq('id', apt.specialty_id)
            .maybeSingle();

          return {
            ...apt,
            doctor_profile: doctorProfile,
            specialty: specialty
          };
        })
      );

      const enrichedPast = await Promise.all(
        past.map(async (apt) => {
          const { data: doctorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', apt.doctor_id)
            .maybeSingle();

          const { data: specialty } = await supabase
            .from('specialties')
            .select('name')
            .eq('id', apt.specialty_id)
            .maybeSingle();

          return {
            ...apt,
            doctor_profile: doctorProfile,
            specialty: specialty
          };
        })
      );

      setAppointments(enrichedUpcoming || []);
      setPastAppointments(enrichedPast || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recentNotifications = await Promise.all(
        (recentAppointments || []).map(async (apt) => {
          const { data: doctorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', apt.doctor_id)
            .maybeSingle();

          const doctorName = doctorProfile?.full_name || 'Doctor';
          const date = formatDate(apt.scheduled_at);
          const time = formatTime(apt.scheduled_at);

          let message = '';
          let type: string = apt.status;

          switch (apt.status) {
            case 'confirmed': message = `${doctorName} confirmed your appointment for ${date} at ${time}`; break;
            case 'cancelled': message = `Your appointment with ${doctorName} on ${date} was cancelled`; break;
            case 'completed': message = `Your appointment with ${doctorName} on ${date} has been completed`; break;
            case 'pending': message = `New appointment with ${doctorName} scheduled for ${date} at ${time}`; break;
            default: message = `Appointment update with ${doctorName}`;
          }

          return {
            id: apt.id,
            type,
            message,
            time: apt.created_at,
            appointment: apt,
            isForm: false
          };
        })
      );

      // Fetch medical_forms separately
      const { data: formsData, error: formsError } = await supabase
        .from('medical_forms')
        .select('*')
        .eq('patient_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (formsError) {
        console.error("Error fetching medical forms", formsError);
      }

      const formNotifications = (formsData || []).map((form) => {
        const type = form.status === 'pending' ? 'form_pending' : 'form_completed';
        const formName = form.form_type === 'male_fertility' ? 'Male Fertility Questionnaire' :
          form.form_type === 'female_fertility' ? 'Female Fertility Questionnaire' :
          form.form_type === 'couple_fertility' ? 'Couple Fertility Questionnaire' : 'Questionnaire';

        const title = form.status === 'pending' ? 'Medical form required' : 'Medical form submitted';
        const message = form.status === 'pending' ?
          `Please complete your ${formName} before your next visit.` :
          `${formName} submitted. All information provided.`;

        return {
          id: `form-${form.id}`,
          type: type,
          title: title,
          message: message,
          time: form.created_at,
          formId: form.id,
          formType: form.form_type,
          formStatus: form.status,
          isForm: true
        };
      });

      // Merge and sort all notifications
      const allNotifications = [...recentNotifications, ...formNotifications]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(allNotifications);
      const unread = allNotifications.filter(n => n.type === 'confirmed' || (n.isForm && n.type === 'form_pending')).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const initials = useMemo(() => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName]);

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(timestamp);
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEditProfile = () => {
    setEditFormData({
      phone: profileData.phone,
      gender: profileData.gender,
      date_of_birth: profileData.date_of_birth
    });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setEditingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: editFormData.phone.trim() || null,
          gender: editFormData.gender || null,
          date_of_birth: editFormData.date_of_birth || null
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfileData(prev => ({
        ...prev,
        phone: editFormData.phone,
        gender: editFormData.gender,
        date_of_birth: editFormData.date_of_birth
      }));

      toast.success("Profile updated successfully!");
      setEditProfileOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setEditingProfile(false);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.isForm) {
      if (notification.type === 'form_pending') {
         return (
           <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
             <Icon icon="solar:clipboard-text-bold" className="text-lg" />
           </div>
         );
      } else {
         return (
           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
             <Icon icon="solar:check-circle-bold" className="text-lg" />
           </div>
         );
      }
    }

    switch (notification.type) {
      case 'confirmed': 
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:calendar-bold" className="text-lg" />
          </div>
        );
      case 'cancelled': 
        return (
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:close-circle-bold" className="text-lg" />
          </div>
        );
      case 'completed': 
        return (
          <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:bill-bold" className="text-lg" />
          </div>
        );
      case 'pending': 
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Icon icon="solar:clock-circle-bold" className="text-lg" />
          </div>
        );
      default: 
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
             <Icon icon="solar:bell-bold" className="text-lg" />
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.isForm && notification.formStatus === 'pending') {
      setActiveFormDetails({ id: notification.formId!, type: notification.formType! });
      setActiveView('form');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!activeFormDetails) return;
    
    setIsSubmittingForm(true);
    try {
      const { error } = await supabase
        .from('medical_forms')
        .update({
          status: 'submitted',
          data: formData
        })
        .eq('id', activeFormDetails.id);
        
      if (error) throw error;
      
      toast.success("Questionnaire submitted successfully!");
      setActiveView('dashboard');
      
      // Refresh notifications to update form status
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => 
        n.formId === activeFormDetails.id 
          ? { ...n, type: 'completed', formStatus: 'submitted', message: 'Medical form submitted. All information provided.' } 
          : n
      ));
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error.message || "Failed to submit form");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-['Inter'] antialiased min-h-screen flex flex-col">
      <PatientNav
        fullName={fullName}
        initials={initials}
        email={user?.email || ""}
        onSignOut={signOut}
        unreadCount={unreadCount}
        notifications={notifications}
        onMarkAllRead={() => setUnreadCount(0)}
        formatRelativeTime={formatRelativeTime}
        getNotificationIcon={getNotificationIcon}
        onNotificationClick={handleNotificationClick}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex-1 relative z-10">
        {activeView === 'form' && activeFormDetails ? (
           <FertilityIntakeForm 
             formId={activeFormDetails.id}
             formType={activeFormDetails.type}
             onBack={() => setActiveView('dashboard')}
             onSubmit={handleFormSubmit}
             isSubmitting={isSubmittingForm}
           />
        ) : (
          <>
            {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-2">
            Welcome back, {fullName ? fullName.split(' ')[0] : 'Patient'}!
          </h1>
          <p className="text-base font-normal text-slate-500 dark:text-slate-400">
            Manage your medical appointments and health records.
          </p>
        </div>

        <PatientQuickActions onOpenBooking={handleOpenBooking} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-h-[500px]">
          <div className="lg:col-span-2">
            <PatientAppointments
              upcomingAppointments={appointments}
              pastAppointments={pastAppointments}
              loadingAppointments={loadingAppointments}
              onOpenBooking={handleOpenBooking}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          </div>
          <div>
            <PatientProfileCard
              fullName={fullName}
              initials={initials}
              profileData={profileData}
              calculateAge={calculateAge}
              onEditProfile={handleEditProfile}
              onSignOut={signOut}
            />
          </div>
        </div>
          </>
        )}
      </main>

      <PatientBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={() => { fetchAppointments(); fetchNotifications(); }}
        bookingType={bookingType}
        patientName={fullName}
        patientPhone={profileData.phone}
        patientEmail={user?.email}
      />

      <PatientAppointmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        appointments={pastAppointments}
        formatDate={formatDate}
        formatTime={formatTime}
      />

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                placeholder="+233 XX XXX XXXX"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <select
                id="edit-gender"
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-sm"
              >
                <option value="" disabled>Select gender</option>
                <option value="male" className="dark:bg-slate-900">Male</option>
                <option value="female" className="dark:bg-slate-900">Female</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editFormData.date_of_birth}
                onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditProfileOpen(false)}
              disabled={editingProfile}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={editingProfile}>
              {editingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
