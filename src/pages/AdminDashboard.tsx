import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useDoctors } from "@/hooks/useDoctors";
import { AddDoctorDialog } from "@/components/admin/AddDoctorDialog";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  MessageSquare,
  BarChart3,
  Megaphone,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Video,
  Hospital,
  Home as HomeIcon,
  UserPlus,
  FileText,
  PlusCircle,
  Loader2,
  Send,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Star,
  LogOut,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { doctors: doctorsData, specialties, loading: doctorsLoading, fetchDoctors } = useDoctors();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    subtitle: "",
    image: null as File | null,
    scheduleDate: "",
    duration: "",
    durationUnit: "days"
  });
  const { toast } = useToast();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorAvailability, setDoctorAvailability] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '17:00'
  });
  
  // Specialty Management state
  const [addSpecialtyOpen, setAddSpecialtyOpen] = useState(false);
  const [editSpecialtyOpen, setEditSpecialtyOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null);
  const [newSpecialty, setNewSpecialty] = useState({
    name: '',
    description: ''
  });

  // Admin Management state
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    otherName: '',
    email: '',
    phone: '',
    gender: '',
    password: ''
  });

  // Patient Management state
  const [patientUsers, setPatientUsers] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [hospitalCardId, setHospitalCardId] = useState('');
  
  // Reports state
  const [reportType, setReportType] = useState<string>('appointments');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportStats, setReportStats] = useState({
    totalAppointments: 0,
    totalRevenue: 0,
    activePatients: 0,
    completionRate: 0
  });

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Handle campaign input changes
  const handleCampaignInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCampaign(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewCampaign(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  // Reset campaign form
  const resetCampaignForm = () => {
    setNewCampaign({
      title: "",
      subtitle: "",
      image: null,
      scheduleDate: "",
      duration: "",
      durationUnit: "days"
    });
  };

  // Handle campaign submission
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCampaign.title || !newCampaign.scheduleDate || !newCampaign.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      setIsUploading(true);
      let imageUrl = "";

      // Upload image if exists
      if (newCampaign.image) {
        const fileExt = newCampaign.image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `campaigns/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('hms')
          .upload(filePath, newCampaign.image);

        console.log({ 'data--- image': data })
        console.log({ 'uploadError--- image': uploadError })

        if (uploadError) throw uploadError;


        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('hms')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }
      console.log({ 'imageUrl----': imageUrl })
      // Save campaign to database
      const { data: campaignData, error } = await supabase
        .from('awareness_campaigns')
        .insert([
          {
            title: newCampaign.title,
            subtitle: newCampaign.subtitle,
            image_url: imageUrl,
            scheduled_date: newCampaign.scheduleDate,
            duration: parseInt(newCampaign.duration),
            duration_unit: newCampaign.durationUnit,
            status: 'scheduled'
          }
        ]);

      console.log({ 'campaignData---': campaignData })
      console.log({ 'campaign error---': error })
      if (error) throw error;

      toast({
        title: "Success",
        description: "Campaign created successfully!"
      });

      // Reset form and close modal
      resetCampaignForm();
      setIsCampaignModalOpen(false);

      // Refresh campaigns list
      const { data: updatedCampaigns } = await supabase
        .from('awareness_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (updatedCampaigns) {
        setCampaigns(updatedCampaigns);
      }

    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Stats state
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const stats = {
    totalAppointments: 42,
    appointmentsTrend: 12,
    pendingFollowUps: 18,
    followUpTrend: -5,
    telemedicineCount: 24,
    telemedicineTrend: 23,
    totalRevenue: 1080,
    revenueTrend: 15,
    totalDoctors: 12,
    activeDoctors: 10,
  };
  // Fetch total patient count from profiles table
  useEffect(() => {
    const fetchPatientCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        setTotalPatients(count);
      }
    };
    fetchPatientCount();
  }, []);

  // Fetch awareness campaigns from database
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('awareness_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch admin users
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data: adminRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (rolesError) throw rolesError;

        if (!adminRoles || adminRoles.length === 0) {
          setAdminUsers([]);
          setLoadingAdmins(false);
          return;
        }

        // Fetch profiles for admin users
        const adminUserIds = adminRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, other_name, full_name, email, phone, gender')
          .in('id', adminUserIds);

        if (profilesError) throw profilesError;

        setAdminUsers(profiles || []);
      } catch (error) {
        console.error('Error fetching admin users:', error);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, []);

  // Fetch patient users
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: patientRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'patient');

        if (rolesError) throw rolesError;

        if (!patientRoles || patientRoles.length === 0) {
          setPatientUsers([]);
          setLoadingPatients(false);
          return;
        }

        // Fetch profiles for patient users
        const patientUserIds = patientRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, other_name, full_name, email, phone, gender, date_of_birth, hospital_card_id, created_at')
          .in('id', patientUserIds)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        setPatientUsers(profiles || []);
      } catch (error) {
        console.error('Error fetching patient users:', error);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  // All doctors are sourced from the database via useDoctors()

  const [appointments, setAppointments] = useState<Array<{
    id: string;
    patientName: string;
    phone: string;
    doctor: string;
    type: string;
    clinic: string | null;
    scheduledDate: string;
    scheduledTime: string;
    scheduledAtISO: string;
    status: string;
    paymentStatus: string;
    symptoms?: string | null;
    location?: string | null;
  }>>([]);

  const doctorFilterOptions = useMemo(() => {
    const names = Array.from(new Set(appointments.map(a => a.doctor).filter(Boolean)));
    return names.filter(n => n && n !== "—");
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const byDoctor = filterDoctor === "all" || a.doctor === filterDoctor;
      const byType = filterType === "all" || a.type === filterType;
      const byStatus = filterStatus === "all" || a.status === filterStatus;
      return byDoctor && byType && byStatus;
    });
  }, [appointments, filterDoctor, filterType, filterStatus]);

  useEffect(() => {
    const loadAppointments = async () => {
      const { data: appts } = await supabase
        .from("appointments" as any)
        .select("id, patient_id, doctor_id, type, clinic, scheduled_at, status, payment_status, symptoms, location")
        .order("created_at", { ascending: false });
      const rows = (appts as any[]) || [];
      const patientIds = Array.from(new Set(rows.map(a => a.patient_id).filter(Boolean)));
      const doctorIds = Array.from(new Set(rows.map(a => a.doctor_id).filter(Boolean)));
      const [{ data: patientProfiles }, { data: doctorProfiles }] = await Promise.all([
        patientIds.length ? supabase.from("profiles").select("id, full_name, phone").in("id", patientIds) : Promise.resolve({ data: [] as any }),
        doctorIds.length ? supabase.from("profiles").select("id, full_name").in("id", doctorIds) : Promise.resolve({ data: [] as any }),
      ]);
      const patientMap = new Map<string, any>((patientProfiles as any[] || []).map((p: any) => [p.id, p]));
      const doctorMap = new Map<string, any>((doctorProfiles as any[] || []).map((p: any) => [p.id, p]));
      setAppointments(rows.map((a: any) => {
        const p = patientMap.get(a.patient_id) as any;
        const d = a.doctor_id ? (doctorMap.get(a.doctor_id) as any) : null;
        const dt = new Date(a.scheduled_at);
        return {
          id: a.id,
          patientName: p?.full_name || "Unknown",
          phone: p?.phone || "",
          doctor: d ? `Dr. ${d.full_name}` : "—",
          type: a.type,
          clinic: a.clinic ?? null,
          scheduledDate: dt.toLocaleDateString(),
          scheduledTime: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          scheduledAtISO: a.scheduled_at,
          status: a.status,
          paymentStatus: a.payment_status,
          symptoms: a.symptoms || null,
          location: a.location || null,
        };
      }));
    };
    loadAppointments();
  }, []);

  const todayAppointmentsCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    return appointments.filter((a) => {
      const dt = new Date(a.scheduledAtISO);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [appointments]);

  // Calculate pending appointments
  const pendingAppointments = useMemo(() => {
    return appointments.filter(a => a.status === 'pending');
  }, [appointments]);

  // Calculate confirmed appointments for today
  const confirmedTodayCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    return appointments.filter((a) => {
      const dt = new Date(a.scheduledAtISO);
      return a.status === 'confirmed' &&
        dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [appointments]);

  // Calculate completed appointments for today
  const completedTodayCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    return appointments.filter((a) => {
      const dt = new Date(a.scheduledAtISO);
      return a.status === 'completed' &&
        dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
  }, [appointments]);

  // Chart data for Reports & Analytics
  const appointmentTypeData = useMemo(() => {
    const online = appointments.filter(a => a.type === 'online').length;
    const hospital = appointments.filter(a => a.type === 'hospital').length;
    const home = appointments.filter(a => a.type === 'home').length;
    
    return [
      { name: 'Online Visits', value: online },
      { name: 'Hospital Visits', value: hospital },
      { name: 'Home Visits', value: home }
    ];
  }, [appointments]);

  const appointmentStatusData = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'pending').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    
    return [
      { name: 'Pending', value: pending },
      { name: 'Confirmed', value: confirmed },
      { name: 'Completed', value: completed },
      { name: 'Cancelled', value: cancelled }
    ];
  }, [appointments]);

  const clinicData = useMemo(() => {
    const clinics = Array.from(new Set(appointments.map(a => a.clinic).filter(Boolean)));
    return clinics.map(clinic => ({
      name: clinic,
      appointments: appointments.filter(a => a.clinic === clinic).length,
      completed: appointments.filter(a => a.clinic === clinic && a.status === 'completed').length,
      pending: appointments.filter(a => a.clinic === clinic && a.status === 'pending').length
    }));
  }, [appointments]);

  // Calculate revenue from paid online consultations
  const [onlineRevenue, setOnlineRevenue] = useState(0);
  const [paidOnlineCount, setPaidOnlineCount] = useState(0);

  useEffect(() => {
    const calculateOnlineRevenue = async () => {
      try {
        // Get all paid online appointments
        const { data: paidAppointments, error } = await supabase
          .from('appointments')
          .select('id, doctor_id, type')
          .eq('type', 'online')
          .eq('payment_status', 'paid');

        if (error) throw error;

        setPaidOnlineCount(paidAppointments?.length || 0);

        // Get unique doctor IDs
        const doctorIds = Array.from(new Set(paidAppointments?.map(apt => apt.doctor_id).filter(Boolean)));
        
        if (doctorIds.length === 0) {
          setOnlineRevenue(0);
          return;
        }

        // Fetch consultation fees for these doctors
        const { data: doctors, error: doctorsError } = await supabase
          .from('doctors')
          .select('user_id, consultation_fee')
          .in('user_id', doctorIds);

        if (doctorsError) throw doctorsError;

        // Create a map of doctor fees
        const feeMap = new Map(doctors?.map(d => [d.user_id, d.consultation_fee || 0]) || []);

        // Calculate total revenue
        let total = 0;
        paidAppointments?.forEach(apt => {
          const fee = feeMap.get(apt.doctor_id) || 50; // Default fee of 50 if not set
          total += Number(fee);
        });

        setOnlineRevenue(total);
      } catch (error) {
        console.error('Error calculating online revenue:', error);
      }
    };

    calculateOnlineRevenue();
  }, [appointments]);

  // Calculate report statistics
  useEffect(() => {
    const calculateReportStats = async () => {
      try {
        // Total appointments
        const totalApts = appointments.length;
        
        // Active patients (unique patient IDs)
        const uniquePatients = new Set(appointments.map(a => a.patientName)).size;
        
        // Completion rate
        const completedCount = appointments.filter(a => a.status === 'completed').length;
        const completionRate = totalApts > 0 ? (completedCount / totalApts) * 100 : 0;
        
        setReportStats({
          totalAppointments: totalApts,
          totalRevenue: onlineRevenue,
          activePatients: uniquePatients,
          completionRate: Math.round(completionRate)
        });
      } catch (error) {
        console.error('Error calculating report stats:', error);
      }
    };

    calculateReportStats();
  }, [appointments, onlineRevenue]);

  // Generate CSV report
  const generateCSVReport = async () => {
    setGeneratingReport(true);
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = '';

      const filterByDateRange = (items: any[]) => {
        if (!startDate && !endDate) return items;
        return items.filter(item => {
          const itemDate = new Date(item.scheduledAtISO || item.created_at);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return itemDate >= start && itemDate <= end;
        });
      };

      switch (reportType) {
        case 'appointments':
          data = filterByDateRange(appointments).map(apt => ({
            'Appointment ID': apt.id.slice(0, 8).toUpperCase(),
            'Patient Name': apt.patientName,
            'Phone': apt.phone,
            'Doctor': apt.doctor,
            'Type': apt.type,
            'Clinic': apt.clinic || 'N/A',
            'Date': apt.scheduledDate,
            'Time': apt.scheduledTime,
            'Status': apt.status,
            'Payment': apt.paymentStatus,
            'Symptoms': apt.symptoms || 'N/A',
            'Location': apt.location || 'N/A'
          }));
          filename = `appointments_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'revenue':
          const revenueData = filterByDateRange(appointments)
            .filter(a => a.paymentStatus === 'paid')
            .map(apt => ({
              'Date': apt.scheduledDate,
              'Patient': apt.patientName,
              'Doctor': apt.doctor,
              'Type': apt.type,
              'Clinic': apt.clinic || 'N/A',
              'Amount': 'GHS 50.00' // Default amount
            }));
          data = revenueData;
          filename = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'doctors':
          const doctorPerformance = doctorsData.map(doc => ({
            'Doctor Name': `Dr. ${doc.profiles?.full_name || 'N/A'}`,
            'Specialty': doc.specialties?.name || 'N/A',
            'License': doc.license_number || 'N/A',
            'Experience': doc.years_of_experience ? `${doc.years_of_experience} years` : 'N/A',
            'Status': doc.available ? 'Available' : 'Unavailable',
            'Total Appointments': appointments.filter(a => a.doctor === `Dr. ${doc.profiles?.full_name}`).length
          }));
          data = doctorPerformance;
          filename = `doctor_performance_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'clinics':
          const clinics = Array.from(new Set(appointments.map(a => a.clinic).filter(Boolean)));
          const clinicData = clinics.map(clinic => ({
            'Clinic Name': clinic,
            'Total Appointments': appointments.filter(a => a.clinic === clinic).length,
            'Completed': appointments.filter(a => a.clinic === clinic && a.status === 'completed').length,
            'Pending': appointments.filter(a => a.clinic === clinic && a.status === 'pending').length,
            'Cancelled': appointments.filter(a => a.clinic === clinic && a.status === 'cancelled').length
          }));
          data = clinicData;
          filename = `clinic_analytics_${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available for the selected criteria",
          variant: "destructive"
        });
        return;
      }

      // Convert to CSV
      headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast({
        title: "Success",
        description: "Report generated and downloaded successfully"
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  // Fetch doctor availability
  const fetchDoctorAvailability = async (doctorId: string) => {
    setLoadingAvailability(true);
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setDoctorAvailability(data || []);
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctor availability",
        variant: "destructive"
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Add new availability slot
  const addAvailabilitySlot = async () => {
    if (!selectedDoctor) return;

    try {
      const { error } = await supabase
        .from('doctor_availability')
        .insert([
          {
            doctor_id: selectedDoctor.user_id,
            day_of_week: newAvailability.dayOfWeek,
            start_time: newAvailability.startTime,
            end_time: newAvailability.endTime
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot added successfully"
      });

      // Refresh availability
      fetchDoctorAvailability(selectedDoctor.user_id);

      // Reset form
      setNewAvailability({
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00'
      });
    } catch (error: any) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add availability slot",
        variant: "destructive"
      });
    }
  };

  // Delete availability slot
  const deleteAvailabilitySlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot deleted"
      });

      // Refresh availability
      if (selectedDoctor) {
        fetchDoctorAvailability(selectedDoctor.user_id);
      }
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete availability slot",
        variant: "destructive"
      });
    }
  };

  // Specialties with doctor counts
  const [specialtiesWithCounts, setSpecialtiesWithCounts] = useState<any[]>([]);

  useEffect(() => {
    const loadSpecialtiesWithCounts = async () => {
      if (!specialties) return;
      
      const specialtiesWithDoctorCounts = await Promise.all(
        specialties.map(async (specialty) => {
          const doctorCount = doctorsData.filter(
            d => d.specialty_id === specialty.id
          ).length;
          
          return {
            ...specialty,
            doctorCount
          };
        })
      );
      
      setSpecialtiesWithCounts(specialtiesWithDoctorCounts);
    };
    
    loadSpecialtiesWithCounts();
  }, [specialties, doctorsData]);

  // Add new specialty
  const handleAddSpecialty = async () => {
    if (!newSpecialty.name.trim()) {
      toast({
        title: "Error",
        description: "Specialty name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('specialties')
        .insert([{
          name: newSpecialty.name.trim(),
          description: newSpecialty.description.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Specialty added successfully"
      });

      setNewSpecialty({ name: '', description: '' });
      setAddSpecialtyOpen(false);
      fetchDoctors(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add specialty",
        variant: "destructive"
      });
    }
  };

  // Update specialty
  const handleUpdateSpecialty = async () => {
    if (!selectedSpecialty || !selectedSpecialty.name.trim()) {
      toast({
        title: "Error",
        description: "Specialty name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('specialties')
        .update({
          name: selectedSpecialty.name.trim(),
          description: selectedSpecialty.description?.trim() || null
        })
        .eq('id', selectedSpecialty.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Specialty updated successfully"
      });

      setEditSpecialtyOpen(false);
      setSelectedSpecialty(null);
      fetchDoctors(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update specialty",
        variant: "destructive"
      });
    }
  };

  // Delete specialty
  const handleDeleteSpecialty = async (specialtyId: string, doctorCount: number) => {
    if (doctorCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This specialty has ${doctorCount} doctor(s) assigned. Reassign them first.`,
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this specialty?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('specialties')
        .delete()
        .eq('id', specialtyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Specialty deleted successfully"
      });

      fetchDoctors(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete specialty",
        variant: "destructive"
      });
    }
  };

  // Add new admin user
  const handleAddAdmin = async () => {
    if (!newAdmin.firstName.trim() || !newAdmin.lastName.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) {
      toast({
        title: "Error",
        description: "First name, last name, email, and password are required",
        variant: "destructive"
      });
      return;
    }

    if (newAdmin.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setAddingAdmin(true);
    try {
      // Create the admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            first_name: newAdmin.firstName,
            last_name: newAdmin.lastName,
            other_name: newAdmin.otherName || '',
            phone: newAdmin.phone,
            gender: newAdmin.gender || null,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Set user role to admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id);

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "Admin account created successfully"
      });

      // Refresh admin list
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        const adminUserIds = adminRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, other_name, full_name, email, phone')
          .in('id', adminUserIds);

        setAdminUsers(profiles || []);
      }

      // Reset form
      setNewAdmin({
        firstName: '',
        lastName: '',
        otherName: '',
        email: '',
        phone: '',
        gender: '',
        password: ''
      });
      setAddAdminOpen(false);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  // Delete user (admin, doctor, or patient)
  const handleDeleteUser = async (userId: string, userType: 'admin' | 'doctor' | 'patient') => {
    const confirmMessage = `Are you sure you want to delete this ${userType}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // If doctor, also delete from doctors table
      if (userType === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctors')
          .delete()
          .eq('user_id', userId);

        if (doctorError) throw doctorError;
      }

      // Note: We don't delete from profiles or auth.users to maintain data integrity
      // The user just won't have a role anymore

      toast({
        title: "Success",
        description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully`
      });

      // Refresh the appropriate list
      if (userType === 'admin') {
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          const adminUserIds = adminRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, other_name, full_name, email, phone, gender')
            .in('id', adminUserIds);

          setAdminUsers(profiles || []);
        } else {
          setAdminUsers([]);
        }
      } else if (userType === 'doctor') {
        fetchDoctors();
      } else if (userType === 'patient') {
        const { data: patientRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'patient');

        if (patientRoles && patientRoles.length > 0) {
          const patientUserIds = patientRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, other_name, full_name, email, phone, gender, date_of_birth, hospital_card_id, created_at')
            .in('id', patientUserIds)
            .order('created_at', { ascending: false });

          setPatientUsers(profiles || []);
        } else {
          setPatientUsers([]);
        }
      }
    } catch (error: any) {
      console.error(`Error deleting ${userType}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${userType}`,
        variant: "destructive"
      });
    }
  };

  // Update patient hospital card ID
  const handleUpdatePatientCardId = async () => {
    if (!selectedPatient) return;

    setUpdatingPatient(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hospital_card_id: hospitalCardId.trim() || null })
        .eq('id', selectedPatient.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient hospital card ID updated successfully"
      });

      // Refresh patient list
      const { data: patientRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'patient');

      if (patientRoles && patientRoles.length > 0) {
        const patientUserIds = patientRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, other_name, full_name, email, phone, gender, date_of_birth, hospital_card_id, created_at')
          .in('id', patientUserIds)
          .order('created_at', { ascending: false });

        setPatientUsers(profiles || []);
      }

      setEditPatientOpen(false);
      setSelectedPatient(null);
      setHospitalCardId('');
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update patient information",
        variant: "destructive"
      });
    } finally {
      setUpdatingPatient(false);
    }
  };

  // Function to update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));

      toast({
        title: "Status updated",
        description: `Appointment status changed to ${newStatus}`,
      });

      // Reload appointments to get fresh data
      const loadAppointments = async () => {
        const { data: appts } = await supabase
          .from("appointments" as any)
          .select("id, patient_id, doctor_id, type, clinic, scheduled_at, status, payment_status, symptoms, location")
          .order("created_at", { ascending: false });
        const rows = (appts as any[]) || [];
        const patientIds = Array.from(new Set(rows.map(a => a.patient_id).filter(Boolean)));
        const doctorIds = Array.from(new Set(rows.map(a => a.doctor_id).filter(Boolean)));
        const [{ data: patientProfiles }, { data: doctorProfiles }] = await Promise.all([
          patientIds.length ? supabase.from("profiles").select("id, full_name, phone").in("id", patientIds) : Promise.resolve({ data: [] as any }),
          doctorIds.length ? supabase.from("profiles").select("id, full_name").in("id", doctorIds) : Promise.resolve({ data: [] as any }),
        ]);
        const patientMap = new Map<string, any>((patientProfiles as any[] || []).map((p: any) => [p.id, p]));
        const doctorMap = new Map<string, any>((doctorProfiles as any[] || []).map((p: any) => [p.id, p]));
        setAppointments(rows.map((a: any) => {
          const p = patientMap.get(a.patient_id) as any;
          const d = a.doctor_id ? (doctorMap.get(a.doctor_id) as any) : null;
          const dt = new Date(a.scheduled_at);
          return {
            id: a.id,
            patientName: p?.full_name || "Unknown",
            phone: p?.phone || "",
            doctor: d ? `Dr. ${d.full_name}` : "—",
            type: a.type,
            clinic: a.clinic ?? null,
            scheduledDate: dt.toLocaleDateString(),
            scheduledTime: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            scheduledAtISO: a.scheduled_at,
            status: a.status,
            paymentStatus: a.payment_status,
            symptoms: a.symptoms || null,
            location: a.location || null,
          };
        }));
      };
      loadAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const followUpQueue = [
    {
      id: "FUP001",
      patientName: "Yaa Mensah",
      phone: "+233 24 444 5555",
      doctor: "Dr. Sarah Mensah",
      type: "hospital",
      priority: "urgent",
      contactAttempts: 2,
      lastContact: "2025-01-26",
      notes: "Patient requested specific date",
    },
    {
      id: "FUP002",
      patientName: "Samuel Addo",
      phone: "+233 24 555 6666",
      doctor: "Dr. Kwame Osei",
      type: "home",
      priority: "high",
      contactAttempts: 1,
      lastContact: "2025-01-27",
      notes: "Location verification needed",
    },
  ];

  // Mock campaigns data removed - now fetching from database

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "online":
        return <Video className="w-4 h-4" />;
      case "hospital":
        return <Hospital className="w-4 h-4" />;
      case "home":
        return <HomeIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-destructive text-destructive-foreground",
      high: "bg-warning text-warning-foreground",
      normal: "bg-muted text-muted-foreground",
    };
    return (
      <Badge className={colors[priority] || "bg-muted"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Hospital className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">Gameli's Hospital</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <ThemeSwitcher />
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("appointments")}
            >
              <Calendar className="w-4 h-4 mr-3" />
              Appointments
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="w-4 h-4 mr-3" />
              User Management
            </Button>
            {/* Follow-up Queue Tab - Deactivated */}
            {/* <Button
              variant={activeTab === "followup" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("followup")}
            >
              <Phone className="w-4 h-4 mr-3" />
              Follow-up Queue
            </Button> */}
            <Button
              variant={activeTab === "campaigns" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("campaigns")}
            >
              <Megaphone className="w-4 h-4 mr-3" />
              Campaigns
            </Button>
            <Button
              variant={activeTab === "communication" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("communication")}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Communication
            </Button>
            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("reports")}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Reports
            </Button>
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">AD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "appointments" && "Appointments Management"}
                {activeTab === "users" && "User Management"}
                {/* {activeTab === "followup" && "Follow-up Queue"} */}
               
                {activeTab === "communication" && "Patient Communication"}
                {activeTab === "reports" && "Reports & Analytics"}
              </h1>
              <p className="text-muted-foreground">
                Welcome back, manage your hospital operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
               {activeTab === "campaigns" && (
                  <div className="flex items-center justify-between w-full">
                    <span>Awareness Campaigns</span>
                    <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="ml-4">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          New Campaign
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Create New Awareness Campaign</DialogTitle>
                          <DialogDescription>
                            Fill in the details below to create a new campaign.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateCampaign}>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Title *</Label>
                              <Input
                                id="title"
                                name="title"
                                value={newCampaign.title}
                                onChange={handleCampaignInputChange}
                                placeholder="Enter campaign title"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="subtitle">Subtitle</Label>
                              <Textarea
                                id="subtitle"
                                name="subtitle"
                                value={newCampaign.subtitle}
                                onChange={handleCampaignInputChange}
                                placeholder="Enter a brief description"
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="image">Campaign Image</Label>
                              <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="cursor-pointer"
                              />
                              {newCampaign.image && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {newCampaign.image.name}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="scheduleDate">Schedule Date *</Label>
                                <Input
                                  id="scheduleDate"
                                  name="scheduleDate"
                                  type="datetime-local"
                                  value={newCampaign.scheduleDate}
                                  onChange={handleCampaignInputChange}
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                  <Label htmlFor="duration">Duration *</Label>
                                  <Input
                                    id="duration"
                                    name="duration"
                                    type="number"
                                    min="1"
                                    value={newCampaign.duration}
                                    onChange={handleCampaignInputChange}
                                    placeholder="e.g. 7"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="durationUnit">Unit</Label>
                                  <Select
                                    value={newCampaign.durationUnit}
                                    onValueChange={(value) =>
                                      setNewCampaign(prev => ({ ...prev, durationUnit: value }))
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="hours">Hours</SelectItem>
                                      <SelectItem value="days">Days</SelectItem>
                                      <SelectItem value="weeks">Weeks</SelectItem>
                                      <SelectItem value="months">Months</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsCampaignModalOpen(false);
                                resetCampaignForm();
                              }}
                              disabled={isUploading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isUploading}>
                              {isUploading ? (
                                <span className="flex items-center">
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Creating...
                                </span>
                              ) : 'Create Campaign'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              {activeTab === "reports" && (
                <Button onClick={generateCSVReport} disabled={generatingReport}>
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        New Requests
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{pendingAppointments.length}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Pending approval</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Confirmed Today
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{confirmedTodayCount}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Confirmed appointments</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completed Today
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{completedTodayCount}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Completed appointments</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Today's Appointments
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{todayAppointmentsCount}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Total for today</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pending Follow-ups
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{stats.pendingFollowUps}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        <span className="text-destructive font-medium">↓ {Math.abs(stats.followUpTrend)}%</span>
                        <span className="text-muted-foreground">from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Online Consultations
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-warning" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{stats.telemedicineCount}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">↑ {stats.telemedicineTrend}%</span>
                        <span className="text-muted-foreground">from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Online Revenue
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-success" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">GHS {onlineRevenue.toFixed(2)}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">{paidOnlineCount} paid consultation{paidOnlineCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* New Requests for Confirmation */}
              {pendingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>New Requests for Confirmation</CardTitle>
                    <CardDescription>
                      {pendingAppointments.length} appointment{pendingAppointments.length !== 1 ? 's' : ''} pending approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingAppointments.map((apt) => {
                        const getTypeIconComponent = () => {
                          switch (apt.type) {
                            case 'online':
                              return <Video className="w-5 h-5 text-primary" />;
                            case 'home':
                              return <HomeIcon className="w-5 h-5 text-accent" />;
                            case 'hospital':
                              return <Hospital className="w-5 h-5 text-secondary" />;
                            default:
                              return <Calendar className="w-5 h-5" />;
                          }
                        };

                        const getTypeLabel = () => {
                          switch (apt.type) {
                            case 'online':
                              return 'Online Consultation Request';
                            case 'home':
                              return 'Home Visit Request';
                            case 'hospital':
                              return 'In-Person Visit Request';
                            default:
                              return 'Appointment Request';
                          }
                        };

                        return (
                          <Card key={apt.id} className="relative">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    {getTypeIconComponent()}
                                  </div>
                                  <div>
                                    <CardTitle className="text-sm font-medium">{getTypeLabel()}</CardTitle>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                  Pending
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-bold text-primary">
                                    {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Patient: {apt.patientName}</p>
                                  {apt.phone && (
                                    <p className="text-xs text-muted-foreground">Contact: {apt.phone}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                {apt.doctor !== "—" && (
                                  <p className="text-muted-foreground">
                                    Requested {apt.doctor} at {apt.scheduledTime}
                                  </p>
                                )}
                                {apt.clinic && (
                                  <p className="text-muted-foreground">Clinic: {apt.clinic}</p>
                                )}
                                <p className="text-muted-foreground">Date: {apt.scheduledDate}</p>
                                {apt.symptoms && (
                                  <p className="text-muted-foreground text-xs line-clamp-2">
                                    Symptoms: {apt.symptoms}
                                  </p>
                                )}
                                {apt.location && apt.type === 'home' && (
                                  <p className="text-muted-foreground text-xs line-clamp-1">
                                    Location: {apt.location}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 pt-2 border-t">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAppointment(apt.id);
                                      setNewStatus(apt.status);
                                      setStatusDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                                <Select
                                  value={apt.status}
                                  onValueChange={(value) => updateAppointmentStatus(apt.id, value)}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                    <CardDescription>Latest bookings today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointments.slice(0, 3).map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              {getTypeIcon(apt.type)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{apt.patientName}</p>
                              <p className="text-sm text-muted-foreground">{apt.doctor}</p>
                            </div>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Doctors</CardTitle>
                    <CardDescription>{stats.activeDoctors} out of {stats.totalDoctors} doctors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(doctorsData || []).slice(0, 3).map((doc) => {
                        const fullName = doc.profiles?.full_name || "Doctor";
                        const initials = fullName.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || "").join("");
                        return (
                          <div key={doc.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{initials || "DR"}</span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{`Dr. ${fullName}`}</p>
                                <p className="text-sm text-muted-foreground">{doc.specialties?.name || ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-warning" />
                              <span className="text-sm font-medium">—</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search appointments..." className="pl-9" />
                      </div>
                    </div>
                    <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Doctors</SelectItem>
                        {doctorFilterOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Appointment Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="home">Home Visit</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments Table */}
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.id.slice(0, 8).toUpperCase()}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{apt.patientName}</p>
                              <p className="text-sm text-muted-foreground">{apt.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{apt.doctor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(apt.type)}
                              <span className="capitalize">{apt.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{apt.clinic}</TableCell>
                          <TableCell>
                            <div>
                              <p>{apt.scheduledDate}</p>
                              <p className="text-sm text-muted-foreground">{apt.scheduledTime}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          <TableCell>
                            <Badge variant={apt.paymentStatus === "paid" ? "default" : "secondary"}>
                              {apt.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={apt.status}
                                onValueChange={(value) => updateAppointmentStatus(apt.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <Tabs defaultValue="admins" className="space-y-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="admins">Administrators</TabsTrigger>
                <TabsTrigger value="doctors">Doctors</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
              </TabsList>

              {/* Administrators Tab */}
              <TabsContent value="admins">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Administrator Accounts</CardTitle>
                        <CardDescription>Manage system administrators</CardDescription>
                      </div>
                      <Button onClick={() => setAddAdminOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Admin
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingAdmins ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : adminUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No admin users found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminUsers.map((admin) => {
                            const fullName = admin.full_name || `${admin.first_name} ${admin.last_name}`.trim();
                            const initials = fullName.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || "").join("");
                            return (
                              <TableRow key={admin.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                      <span className="text-sm font-bold text-destructive">{initials || "AD"}</span>
                                    </div>
                                    <div className="font-medium">{fullName}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>{admin.phone || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge variant="destructive">Admin</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteUser(admin.id, 'admin')}
                                    title="Delete Admin"
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Doctors Tab */}
              <TabsContent value="doctors">
                <Tabs defaultValue="staff" className="space-y-6">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="staff">Medical Staff</TabsTrigger>
                    <TabsTrigger value="specialties">Specialties & Clinics</TabsTrigger>
                  </TabsList>

                  {/* Medical Staff Sub-Tab */}
                  <TabsContent value="staff">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Medical Staff</CardTitle>
                            <CardDescription>Manage doctor profiles and specializations</CardDescription>
                          </div>
                          <Button onClick={() => setAddDoctorOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Doctor
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                {doctorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : doctorsData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No doctors found. Add your first doctor to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctorsData.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {doctor.profiles?.full_name || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {doctor.specialties?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-foreground">{doctor.profiles?.email}</div>
                              <div className="text-muted-foreground">{doctor.profiles?.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {doctor.license_number || 'N/A'}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {doctor.years_of_experience ? `${doctor.years_of_experience} years` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doctor.available ? "default" : "secondary"}>
                              {doctor.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  fetchDoctorAvailability(doctor.user_id);
                                  setAvailabilityDialogOpen(true);
                                }}
                                title="Manage Availability"
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(doctor.user_id, 'doctor')}
                                title="Delete Doctor"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Specialties & Clinics Sub-Tab */}
                  <TabsContent value="specialties">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Specialties & Clinics</CardTitle>
                        <CardDescription>Manage available medical specialties</CardDescription>
                      </div>
                      <Button onClick={() => setAddSpecialtyOpen(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Specialty
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                {specialtiesWithCounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No specialties found. Add your first specialty to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Specialty Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Doctors</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialtiesWithCounts.map((specialty) => (
                        <TableRow key={specialty.id}>
                          <TableCell className="font-medium">{specialty.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {specialty.description || 'No description'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{specialty.doctorCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSpecialty(specialty);
                                  setEditSpecialtyOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSpecialty(specialty.id, specialty.doctorCount)}
                                disabled={specialty.doctorCount > 0}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                    </CardContent>
                  </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Patients Tab */}
              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Accounts</CardTitle>
                    <CardDescription>View and manage patient information ({patientUsers.length} total patients)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Search patients by name or email..." 
                            className="pl-9"
                            value={patientSearchQuery}
                            onChange={(e) => setPatientSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {loadingPatients ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : patientUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="font-medium mb-2">No patients found</p>
                          <p className="text-sm">
                            Patients will appear here once they register
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Patient</TableHead>
                              <TableHead>Date of Birth</TableHead>
                              <TableHead>Hospital Card ID</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patientUsers
                              .filter(patient => {
                                if (!patientSearchQuery) return true;
                                const searchLower = patientSearchQuery.toLowerCase();
                                const fullName = patient.full_name || `${patient.first_name} ${patient.last_name}`.trim();
                                return (
                                  fullName.toLowerCase().includes(searchLower) ||
                                  patient.email?.toLowerCase().includes(searchLower) ||
                                  patient.phone?.toLowerCase().includes(searchLower) ||
                                  patient.hospital_card_id?.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((patient) => {
                                const fullName = patient.full_name || `${patient.first_name} ${patient.last_name}`.trim();
                                const initials = fullName.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || "").join("");
                                return (
                                  <TableRow key={patient.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-sm font-bold text-primary">{initials || "PT"}</span>
                                        </div>
                                        <div>
                                          <div className="font-medium">{fullName}</div>
                                          {patient.other_name && (
                                            <div className="text-xs text-muted-foreground">({patient.other_name})</div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {patient.date_of_birth ? (
                                        <div>
                                          <div className="font-medium">
                                            {new Date(patient.date_of_birth).toLocaleDateString()}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            Age: {Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {patient.hospital_card_id ? (
                                        <Badge variant="outline" className="font-mono">
                                          {patient.hospital_card_id}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">Not assigned</span>
                                      )}
                                    </TableCell>
                                    <TableCell>{patient.email || 'N/A'}</TableCell>
                                    <TableCell>{patient.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                      {patient.gender ? (
                                        <Badge variant="outline" className="capitalize">
                                          {patient.gender}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">N/A</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => {
                                            setSelectedPatient(patient);
                                            setHospitalCardId(patient.hospital_card_id || '');
                                            setEditPatientOpen(true);
                                          }}
                                          title="Edit Patient Card ID"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => {
                                            // View patient appointments
                                            setFilterDoctor("all");
                                            setFilterType("all");
                                            setFilterStatus("all");
                                            setActiveTab("appointments");
                                          }}
                                          title="View Appointments"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteUser(patient.id, 'patient')}
                                          title="Delete Patient"
                                        >
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Follow-up Queue Tab - Deactivated */}
          {false && activeTab === "followup" && (
            <div className="space-y-6">
              {/* Queue Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Urgent</p>
                        <p className="text-2xl font-bold text-destructive">3</p>
                      </div>
                      <Clock className="w-8 h-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-2xl font-bold text-warning">8</p>
                      </div>
                      <Clock className="w-8 h-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                        <p className="text-2xl font-bold text-primary">7</p>
                      </div>
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Follow-up Table */}
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Contact Attempts</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followUpQueue.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.patientName}</p>
                              <p className="text-sm text-muted-foreground">{item.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.doctor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <span className="capitalize">{item.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                          <TableCell>{item.contactAttempts}</TableCell>
                          <TableCell>{item.lastContact}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="default">
                                <Phone className="w-3 h-3 mr-1" />
                                Call
                              </Button>
                              <Button size="sm" variant="outline">
                                <Send className="w-3 h-3 mr-1" />
                                SMS
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <div className="space-y-6">
              {loadingCampaigns ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : campaigns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                    <Megaphone className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first awareness campaign to get started</p>
                    <Button onClick={() => setIsCampaignModalOpen(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{campaign.title}</CardTitle>
                            <CardDescription className="mt-2">{campaign.subtitle || 'No description'}</CardDescription>
                          </div>
                          <Badge variant={campaign.status === "active" ? "default" : campaign.status === "scheduled" ? "secondary" : "outline"}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {campaign.image_url && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={campaign.image_url} 
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Scheduled Date</span>
                              <span className="font-medium">
                                {new Date(campaign.scheduled_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Duration</span>
                              <span className="font-medium">
                                {campaign.duration} {campaign.duration_unit}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Created</span>
                              <span className="font-medium">
                                {new Date(campaign.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={async () => {
                                const newStatus = campaign.status === 'active' ? 'scheduled' : 'active';
                                const { error } = await supabase
                                  .from('awareness_campaigns')
                                  .update({ status: newStatus })
                                  .eq('id', campaign.id);
                                if (!error) {
                                  setCampaigns(campaigns.map(c => 
                                    c.id === campaign.id ? { ...c, status: newStatus } : c
                                  ));
                                  toast({
                                    title: "Success",
                                    description: `Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'}`
                                  });
                                }
                              }}
                            >
                              {campaign.status === 'active' ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => {
                                if (campaign.image_url) {
                                  window.open(campaign.image_url, '_blank');
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Communication Tab */}
          {activeTab === "communication" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Bulk Message</CardTitle>
                  <CardDescription>Send SMS or email to patients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipients</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Patients</SelectItem>
                        <SelectItem value="gynae">Gynae Clinic Patients</SelectItem>
                        <SelectItem value="fertility">Fertility Clinic Patients</SelectItem>
                        <SelectItem value="today">Today's Appointments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Type</label>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        SMS
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <textarea
                      className="w-full min-h-[120px] p-3 rounded-md border bg-background"
                      placeholder="Type your message here..."
                    />
                  </div>
                  <Button className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointment Types Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Types Distribution</CardTitle>
                    <CardDescription>Breakdown by consultation method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={appointmentTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {appointmentTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Appointment Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Status</CardTitle>
                    <CardDescription>Current status distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={appointmentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {appointmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Clinic Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Clinic Performance</CardTitle>
                  <CardDescription>Appointments by clinic/specialty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clinicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="appointments" fill="#3b82f6" name="Total" />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                      <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Report Generation Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Export data for analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger id="reportType">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointments">Appointments Report</SelectItem>
                          <SelectItem value="revenue">Revenue Report</SelectItem>
                          <SelectItem value="doctors">Doctor Performance</SelectItem>
                          <SelectItem value="clinics">Clinic Analytics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={generateCSVReport}
                        disabled={generatingReport}
                      >
                        {generatingReport ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Generate CSV
                          </>
                        )}
                      </Button>
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-muted-foreground">
                        {startDate && endDate ? (
                          `Showing data from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                        ) : startDate ? (
                          `Showing data from ${new Date(startDate).toLocaleDateString()} onwards`
                        ) : (
                          `Showing data up to ${new Date(endDate).toLocaleDateString()}`
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>Overview of key metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Appointments</span>
                        <span className="text-2xl font-bold">{reportStats.totalAppointments.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="text-2xl font-bold">GHS {reportStats.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active Patients</span>
                        <span className="text-2xl font-bold">{reportStats.activePatients}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="text-2xl font-bold">{reportStats.completionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <AddDoctorDialog
        open={addDoctorOpen}
        onOpenChange={setAddDoctorOpen}
        specialties={specialties}
        onSuccess={fetchDoctors}
      />

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status of this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAppointment && newStatus) {
                  updateAppointmentStatus(selectedAppointment, newStatus);
                  setStatusDialogOpen(false);
                  setSelectedAppointment(null);
                  setNewStatus('');
                }
              }}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Specialty Dialog */}
      <Dialog open={addSpecialtyOpen} onOpenChange={setAddSpecialtyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Specialty</DialogTitle>
            <DialogDescription>
              Create a new medical specialty or clinic type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialtyName">Specialty Name *</Label>
              <Input
                id="specialtyName"
                placeholder="e.g., Cardiology"
                value={newSpecialty.name}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialtyDescription">Description</Label>
              <Textarea
                id="specialtyDescription"
                placeholder="Brief description of this specialty"
                value={newSpecialty.description}
                onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSpecialtyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSpecialty}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Specialty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specialty Dialog */}
      <Dialog open={editSpecialtyOpen} onOpenChange={setEditSpecialtyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Specialty</DialogTitle>
            <DialogDescription>
              Update specialty information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSpecialtyName">Specialty Name *</Label>
              <Input
                id="editSpecialtyName"
                placeholder="e.g., Cardiology"
                value={selectedSpecialty?.name || ''}
                onChange={(e) => setSelectedSpecialty({ ...selectedSpecialty, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSpecialtyDescription">Description</Label>
              <Textarea
                id="editSpecialtyDescription"
                placeholder="Brief description of this specialty"
                value={selectedSpecialty?.description || ''}
                onChange={(e) => setSelectedSpecialty({ ...selectedSpecialty, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSpecialtyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSpecialty}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Administrator</DialogTitle>
            <DialogDescription>
              Create a new admin account with full system access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">First Name *</Label>
              <Input
                id="adminFirstName"
                placeholder="John"
                value={newAdmin.firstName}
                onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminOtherName">Other Name</Label>
                <Input
                  id="adminOtherName"
                  placeholder="Michael"
                  value={newAdmin.otherName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, otherName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminLastName">Last Name *</Label>
                <Input
                  id="adminLastName"
                  placeholder="Doe"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@gamelishospital.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Phone Number</Label>
              <Input
                id="adminPhone"
                placeholder="+233 24 123 4567"
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminGender">Gender</Label>
              <Select
                value={newAdmin.gender}
                onValueChange={(value) => setNewAdmin({ ...newAdmin, gender: value })}
              >
                <SelectTrigger id="adminGender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  {/* <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password *</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
            </div>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> Admin users have full access to all system features including user management, appointments, and settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminOpen(false)} disabled={addingAdmin}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} disabled={addingAdmin}>
              {addingAdmin ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editPatientOpen} onOpenChange={setEditPatientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>
              Update the hospital card ID for {selectedPatient?.full_name || `${selectedPatient?.first_name} ${selectedPatient?.last_name}`.trim()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hospitalCardId">Hospital Card ID</Label>
              <Input
                id="hospitalCardId"
                placeholder="e.g., HC-2025-001"
                value={hospitalCardId}
                onChange={(e) => setHospitalCardId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is the physical card number given to the patient on their first hospital visit.
              </p>
            </div>
            <div className="p-3 bg-muted/50 border rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient Name:</span>
                  <span className="font-medium">{selectedPatient?.full_name || `${selectedPatient?.first_name} ${selectedPatient?.last_name}`.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedPatient?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{selectedPatient?.phone}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditPatientOpen(false);
                setSelectedPatient(null);
                setHospitalCardId('');
              }}
              disabled={updatingPatient}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePatientCardId} disabled={updatingPatient}>
              {updatingPatient ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Availability - Dr. {selectedDoctor?.profiles?.full_name}
            </DialogTitle>
            <DialogDescription>
              Set the doctor's working hours for each day of the week
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Availability */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Current Availability</h3>
              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : doctorAvailability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No availability set. Add time slots below.
                </div>
              ) : (
                <div className="space-y-2">
                  {doctorAvailability.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">
                            {slot.day_of_week}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {slot.start_time} - {slot.end_time}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAvailabilitySlot(slot.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Availability */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Add New Time Slot</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={newAvailability.dayOfWeek}
                    onValueChange={(value) =>
                      setNewAvailability((prev) => ({ ...prev, dayOfWeek: value }))
                    }
                  >
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newAvailability.startTime}
                    onChange={(e) =>
                      setNewAvailability((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newAvailability.endTime}
                    onChange={(e) =>
                      setNewAvailability((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button onClick={addAvailabilitySlot} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAvailabilityDialogOpen(false);
                setSelectedDoctor(null);
                setDoctorAvailability([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
