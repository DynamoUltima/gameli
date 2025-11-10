import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
              variant={activeTab === "doctors" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("doctors")}
            >
              <Users className="w-4 h-4 mr-3" />
              Doctors
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
                {activeTab === "doctors" && "Doctors Management"}
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
              {activeTab === "doctors" && (
                <Button onClick={() => setAddDoctorOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Doctor
                </Button>
              )}
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
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              )}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Revenue (Online)
                      </CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-success" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">{stats.totalRevenue} GHS</div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">↑ {stats.revenueTrend}%</span>
                        <span className="text-muted-foreground">from last week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}
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

          {/* Doctors Tab */}
          {activeTab === "doctors" && (
            <Card>
              <CardHeader>
                <CardTitle>Medical Staff</CardTitle>
                <CardDescription>Manage doctor profiles and specializations</CardDescription>
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
                        <TableHead>Fee (GHS)</TableHead>
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
                          <TableCell className="text-foreground">
                            {doctor.consultation_fee || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doctor.available ? "default" : "secondary"}>
                              {doctor.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Export data for analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Report Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointments">Appointments Report</SelectItem>
                        <SelectItem value="revenue">Revenue Report</SelectItem>
                        <SelectItem value="doctors">Doctor Performance</SelectItem>
                        <SelectItem value="clinics">Clinic Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-4">
                      <Input type="date" placeholder="Start Date" />
                      <Input type="date" placeholder="End Date" />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button className="flex-1" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
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
                        <span className="text-2xl font-bold">1,247</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Revenue</span>
                        <span className="text-2xl font-bold">45,230 GHS</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active Patients</span>
                        <span className="text-2xl font-bold">823</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="text-2xl font-bold">94%</span>
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
    </div>
  );
};

export default AdminDashboard;
