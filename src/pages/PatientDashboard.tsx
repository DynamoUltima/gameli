import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  FileText, 
  Video, 
  Hospital, 
  Home as HomeIcon,
  Plus,
  Bell,
  Settings,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'confirmed' | 'cancelled' | 'pending' | 'completed';
  message: string;
  time: string;
  appointment: any;
}

const PatientDashboard = () => {
  const { user, signOut } = useAuth(true);
  const [fullName, setFullName] = useState<string>("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Format date for display from timestamp
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display from timestamp
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
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setFullName(profile?.full_name ?? "");
    };
    loadProfile();
  }, [user?.id]);

  // Fetch appointments from database
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return;
      
      try {
        // First fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        // Then fetch related data for each appointment
        const enrichedAppointments = await Promise.all(
          (appointmentsData || []).map(async (apt) => {
            // Fetch doctor profile
            const { data: doctorProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.doctor_id)
              .single();

            // Fetch specialty
            const { data: specialty } = await supabase
              .from('specialties')
              .select('name')
              .eq('id', apt.specialty_id)
              .single();

            return {
              ...apt,
              doctor_profile: doctorProfile,
              specialty: specialty
            };
          })
        );

        console.log('Fetched appointments:', enrichedAppointments);
        setAppointments(enrichedAppointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  // Fetch recent activities/notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        // Get appointments from the last 7 days with status updates
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentAppointments, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich and convert to notifications
        const recentNotifications = await Promise.all(
          (recentAppointments || []).map(async (apt) => {
            // Fetch doctor profile
            const { data: doctorProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.doctor_id)
              .single();

            const doctorName = doctorProfile?.full_name || 'Doctor';
            const date = formatDate(apt.scheduled_at);
            const time = formatTime(apt.scheduled_at);

            let message = '';
            let type: 'confirmed' | 'cancelled' | 'pending' | 'completed' = apt.status;

            switch (apt.status) {
              case 'confirmed':
                message = `${doctorName} confirmed your appointment for ${date} at ${time}`;
                break;
              case 'cancelled':
                message = `Your appointment with ${doctorName} on ${date} was cancelled`;
                break;
              case 'completed':
                message = `Your appointment with ${doctorName} on ${date} has been completed`;
                break;
              case 'pending':
                message = `New appointment with ${doctorName} scheduled for ${date} at ${time}`;
                break;
              default:
                message = `Appointment update with ${doctorName}`;
            }

            return {
              id: apt.id,
              type,
              message,
              time: apt.created_at,
              appointment: apt
            };
          })
        );

        setNotifications(recentNotifications);
        // Count confirmed appointments as unread
        const unread = recentNotifications.filter(n => n.type === 'confirmed').length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const initials = useMemo(() => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName]);

  // Format relative time for notifications
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

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Hospital className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Gameli's Hospital</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Recent activities and updates
                  </p>
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(notification.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setUnreadCount(0);
                      }}
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">{initials || "PT"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{`Welcome back, ${fullName || "Patient"}!`}</h1>
          <p className="text-muted-foreground">Manage your appointments and health records</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary">
            <Link to="/book/online">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Online Visit</h3>
                    <p className="text-sm text-muted-foreground">Video consultation</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-accent">
            <Link to="/book/hospital">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Hospital className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Hospital Visit</h3>
                    <p className="text-sm text-muted-foreground">In-person care</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-secondary">
            <Link to="/book/home">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <HomeIcon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Home Visit</h3>
                    <p className="text-sm text-muted-foreground">Care at home</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Appointments Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>Your scheduled consultations</CardDescription>
                  </div>
                  <Button asChild>
                    <Link to="/book/online">
                      <Plus className="w-4 h-4 mr-2" />
                      New
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">No upcoming appointments</h3>
                    <p className="text-muted-foreground text-sm mb-4">Book your first appointment to get started</p>
                    <Button asChild size="sm">
                      <Link to="/book/online">
                        <Plus className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => {
                      // Handle nested data structure from Supabase
                      const doctorName = apt.doctor_profile?.full_name || "Doctor";
                      const specialty = apt.specialty?.name || apt.clinic || "General";
                      const doctorInitials = doctorName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                      
                      return (
                        <div key={apt.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {doctorInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{doctorName}</h4>
                                <p className="text-sm text-muted-foreground">{specialty}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(apt.scheduled_at)}
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    {formatTime(apt.scheduled_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge variant={apt.status === "pending" || apt.status === "confirmed" ? "default" : "secondary"}>
                              {apt.status}
                            </Badge>
                          </div>
                          {(apt.status === "pending" || apt.status === "confirmed") && apt.type === "online" && (
                            <Button className="w-full mt-4" variant="outline">
                              <Video className="w-4 h-4 mr-2" />
                              Join Video Call
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center pb-4">
                  <Avatar className="h-20 w-20 mx-auto mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials || "PT"}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{fullName || "Patient"}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: #PT-2025-0042</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">32 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium">Female</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blood Type:</span>
                    <span className="font-medium">O+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Blood Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  X-Ray Results
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Prescriptions
                </Button>
              </CardContent>
            </Card> */}

            <Button variant="destructive" className="w-full" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
