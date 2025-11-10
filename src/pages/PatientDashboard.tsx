import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Loader2
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PatientDashboard = () => {
  const { user, signOut } = useAuth(true);
  const [fullName, setFullName] = useState<string>("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

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
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            doctors (
              id,
              profiles (
                full_name
              ),
              specialties (
                name
              )
            )
          `)
          .eq('patient_id', user.id)
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true });

        if (error) throw error;
        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  const initials = useMemo(() => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  }, [fullName]);
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
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
                      const doctorName = apt.doctors?.profiles?.full_name || "Doctor";
                      const specialty = apt.doctors?.specialties?.name || "General";
                      const initials = doctorName.split(' ').map((n: string) => n[0]).join('');
                      
                      return (
                        <div key={apt.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{doctorName}</h4>
                                <p className="text-sm text-muted-foreground">{specialty}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(apt.appointment_date)}
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    {formatTime(apt.appointment_time)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Badge variant={apt.status === "scheduled" || apt.status === "confirmed" ? "default" : "secondary"}>
                              {apt.status}
                            </Badge>
                          </div>
                          {(apt.status === "scheduled" || apt.status === "confirmed") && apt.appointment_type === "online" && (
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
