import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lock, Phone, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useUserRole } from "@/hooks/useUserRole";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const { role, loading: roleLoading } = useUserRole(currentUserId);


  useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    console.log('Supabase connection test:', error ? 'Failed' : 'Success');
    console.log('Connected to:', supabase);
  };
  testConnection();
}, []);

  // Check if user is already logged in and redirect based on role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    };
    checkAuth();
  }, []);

  // Handle redirect after role is loaded
  useEffect(() => {
    if (currentUserId && !roleLoading && role) {
      const getDashboardPath = () => {
        if (redirectTo && redirectTo !== "/" && redirectTo.includes("/book/")) {
          return redirectTo;
        }
        switch (role) {
          case 'doctor':
            return '/dashboard/doctor';
          case 'admin':
            return '/dashboard/admin';
          default:
            return '/dashboard/patient';
        }
      };
      navigate(getDashboardPath());
    }
  }, [currentUserId, role, roleLoading, redirectTo, navigate]);

  // Registration form
  const [registerData, setRegisterData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: 'patient' as 'patient' | 'doctor' | 'admin', // default role with proper typing
  });

  // Login form
  const [loginData, setLoginData] = useState({
    phone: "",
    password: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    console.log({'email':registerData.email})
    console.log({'password':registerData.password})
    console.log({'role':registerData.role})
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone,
            role: registerData.role,
          }
        }
      });

      console.log(error)
      console.log({'data':data})

      if (error) throw error;

      if (!data.user?.id) {
        throw new Error("User creation failed");
      }

      // Wait a moment for the user to be fully created in the system
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Insert user role with service role client if available, otherwise use regular client
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: registerData.role
        });

      if (roleError) {
        console.error("Error setting user role:", roleError);
        toast.error("Account created but role setting failed. Please contact support.");
        return;
      }

      toast.success("Registration successful! Please check your email to confirm your account.");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For login, we need email, so we'll use phone as identifier but require email format
    if (!loginData.phone || !loginData.password) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.phone, // Using phone field for email
        password: loginData.password,
      });

      console.log({'login data':data})

      if (error) throw error;

      // Fetch user role to determine redirect
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      toast.success("Login successful! Redirecting...");
      
      setTimeout(() => {
        if (redirectTo && redirectTo !== "/" && redirectTo.includes("/book/")) {
          navigate(redirectTo);
        } else {
          const role = roleData?.role;
          switch (role) {
            case 'doctor':
              navigate('/dashboard/doctor');
              break;
            case 'admin':
              navigate('/dashboard/admin');
              break;
            default:
              navigate('/dashboard/patient');
          }
        }
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 py-8">
      <div className="container max-w-md mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link>
          </Button>
          <ThemeSwitcher />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Login to access your patient dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-phone"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        value={loginData.phone}
                        onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <span className="text-primary cursor-pointer hover:underline">
                      Register here
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Register as a new patient to book appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-phone"
                        placeholder="+233 XX XXX XXXX"
                        className="pl-10"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">Register As</Label>
                    <select
                      id="register-role"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as 'patient' | 'doctor' | 'admin' })}
                      className="w-full rounded-md border px-3 py-2 bg-transparent"
                    >
                      <option value="patient">Patient</option>
                      {/* <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option> */}
                    </select>
                    {registerData.role !== 'patient' && (
                      <p className="text-sm text-muted-foreground">Selecting Doctor or Admin will require approval — an administrator will verify your account before elevated access is granted.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className="pl-10"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        className="pl-10"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Re-enter your password"
                        className="pl-10"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <span className="text-primary cursor-pointer hover:underline">
                      Login here
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
