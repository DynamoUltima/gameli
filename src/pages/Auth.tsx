import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Phone,
  User,
  Mail,
  CreditCard,
  Eye,
  EyeOff,
  ShieldCheck,
  Heart,
  UserRoundCheck,
  LogIn,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const { role, loading: roleLoading } = useUserRole(currentUserId);

  // Flow state: 'register' or 'login'
  const [flow, setFlow] = useState<'register' | 'login'>('login');
  // Registration step
  const [regStep, setRegStep] = useState(1);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      console.log('Supabase connection test:', error ? 'Failed' : 'Success');
      console.log('Connected to:', supabase);
    };
    testConnection();
  }, []);

  // Check if user is coming from password reset email
  useEffect(() => {
    const checkPasswordReset = async () => {
      const resetParam = searchParams.get('reset');
      const { data: { session } } = await supabase.auth.getSession();
      if (session && resetParam === 'true') {
        setIsResettingPassword(true);
      }
    };
    checkPasswordReset();
  }, [searchParams]);

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
    firstName: "",
    lastName: "",
    otherName: "",
    phone: "",
    dateOfBirth: "",
    hospitalCardId: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    role: 'patient' as 'patient' | 'doctor' | 'admin',
  });

  // Login form
  const [loginData, setLoginData] = useState({
    phone: "",
    password: ""
  });

  // Password reset state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Password strength
  const passwordStrength = useMemo(() => {
    const val = registerData.password;
    if (val.length === 0) return { level: 0, label: "Must be at least 6 characters", color: "slate" };
    if (val.length < 6) return { level: 1, label: "Weak", color: "red" };
    if (val.length < 9) return { level: 2, label: "Fair", color: "amber" };
    if (val.length < 12) return { level: 3, label: "Good", color: "blue" };
    return { level: 4, label: "Strong", color: "emerald" };
  }, [registerData.password]);

  const strengthBarColors: Record<string, string> = {
    red: "bg-red-400",
    amber: "bg-amber-400",
    blue: "bg-blue-400",
    emerald: "bg-emerald-400",
  };

  const strengthTextColors: Record<string, string> = {
    slate: "text-slate-400",
    red: "text-red-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!registerData.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (registerData.hospitalCardId.trim()) {
      const { data: existingCard, error: cardError } = await supabase
        .from('profiles')
        .select('id')
        .eq('hospital_card_id', registerData.hospitalCardId.trim())
        .maybeSingle();

      if (cardError) {
        console.error('Error checking hospital card ID:', cardError);
      } else if (existingCard) {
        toast.error("This hospital card ID is already registered. Please contact the hospital if you believe this is an error.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            other_name: registerData.otherName,
            phone: registerData.phone,
            date_of_birth: registerData.dateOfBirth || null,
            hospital_card_id: registerData.hospitalCardId.trim() || null,
            gender: registerData.gender || null,
            role: registerData.role,
          }
        }
      });

      if (error) throw error;

      if (!data.user?.id) {
        throw new Error("User creation failed");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error("Please enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully! You can now login with your new password.");

      await supabase.auth.signOut();
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      navigate('/auth');
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.phone || !loginData.password) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.phone,
        password: loginData.password,
      });

      if (error) throw error;

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

  const goToStep = (step: number) => {
    if (step === 2) {
      if (!registerData.firstName.trim() || !registerData.lastName.trim()) {
        toast.error("Please fill out First Name and Last Name before continuing.");
        return;
      }
    }
    setRegStep(step);
  };

  // --- INPUT CLASSES ---
  const inputBase =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
  const inputWithIconLeft = `${inputBase} pl-11`;

  // --- RENDER: Password Reset ---
  if (isResettingPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-14 h-14 object-contain rounded-full shadow-sm border border-slate-100 mb-4 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 mb-2">
            Set New Password
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[520px] bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-fade-in-up">
          <form onSubmit={handleUpdatePassword} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputWithIconLeft + " pr-12"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px] stroke-[1.5]" /> : <Eye className="w-[18px] h-[18px] stroke-[1.5]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                  Confirm New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={inputWithIconLeft + " pr-12"}
                    placeholder="Re-enter your password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px] stroke-[1.5]" /> : <Eye className="w-[18px] h-[18px] stroke-[1.5]" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-2 border-t border-slate-50">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 focus:ring-4 focus:ring-blue-600/20 outline-none flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(false);
                navigate('/auth');
              }}
              className="text-slate-900 hover:text-blue-600 transition-colors ml-1 hover:underline underline-offset-4 decoration-2 decoration-blue-200 hover:decoration-blue-600"
            >
              Back to login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN AUTH PAGE ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">

      {/* Register Header */}
      {flow === 'register' && (
        <div className="mb-8 text-center animate-fade-in">
          <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-14 h-14 object-contain rounded-full shadow-sm border border-slate-100 mb-4 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 mb-2">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Register as a new patient to access records and book appointments effortlessly.
          </p>
        </div>
      )}

      {/* Login Header */}
      {flow === 'login' && (
        <div className="mb-8 text-center animate-fade-in">
          <img src="/logo.jpg" alt="St. Gamaliel's Hospital Logo" className="w-14 h-14 object-contain rounded-full shadow-sm border border-slate-100 mb-4 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Sign in to your patient portal to manage appointments and access your records.
          </p>
        </div>
      )}

      {/* Main Form Card */}
      <div className="w-full max-w-[520px] bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative animate-fade-in-up">

        {/* Progress Bar (Register only) */}
        {flow === 'register' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: regStep === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        {/* ========== REGISTRATION FORM ========== */}
        {flow === 'register' && (
          <form onSubmit={handleRegister} className="p-6 sm:p-8">

            {/* STEP 1: Personal Information */}
            {regStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Step 1 of 2</span>
                </div>

                <div className="space-y-4">
                  {/* Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        className={inputBase}
                        placeholder="Jane"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        className={inputBase}
                        placeholder="Doe"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                      Middle / Other Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className={inputBase}
                      placeholder="Middle name"
                      value={registerData.otherName}
                      onChange={(e) => setRegisterData({ ...registerData, otherName: e.target.value })}
                    />
                  </div>

                  {/* Gender & DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">Gender</label>
                      <div className="relative">
                        <select
                          className={`${inputBase} appearance-none cursor-pointer pr-10`}
                          value={registerData.gender}
                          onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
                        >
                          <option value="" disabled>Select...</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                        Date of Birth <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        className={inputBase}
                        value={registerData.dateOfBirth}
                        onChange={(e) => setRegisterData({ ...registerData, dateOfBirth: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {/* Hospital Card ID */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                      Hospital Card ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={inputWithIconLeft}
                        placeholder="e.g. HC-109482"
                        value={registerData.hospitalCardId}
                        onChange={(e) => setRegisterData({ ...registerData, hospitalCardId: e.target.value })}
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                    </div>
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-6 mt-2 border-t border-slate-50 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="w-full sm:w-auto flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md focus:ring-4 focus:ring-slate-900/10 outline-none flex items-center justify-center gap-2"
                  >
                    Continue to Security
                    <ArrowRight className="w-[18px] h-[18px] stroke-[1.5]" />
                  </button>
                  <Link
                    to="/"
                    className="w-full sm:w-auto px-6 py-3 bg-white text-slate-600 border border-slate-200/80 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none focus:ring-4 focus:ring-slate-100 text-center no-underline"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 2: Contact & Security */}
            {regStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900">Contact &amp; Security</h2>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Step 2 of 2</span>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className={inputWithIconLeft}
                        placeholder="jane@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        className={inputWithIconLeft}
                        placeholder="+233 XX XXX XXXX"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={inputWithIconLeft + " pr-12"}
                        placeholder="Create a strong password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px] stroke-[1.5]" /> : <Eye className="w-[18px] h-[18px] stroke-[1.5]" />}
                      </button>
                    </div>

                    {/* Strength Indicator */}
                    <div className="mt-2.5 px-1">
                      <div className="flex gap-1.5 h-[3px] w-full max-w-[220px]">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                              i <= passwordStrength.level
                                ? (strengthBarColors[passwordStrength.color] || 'bg-slate-200')
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium mt-1.5 tracking-tight ${strengthTextColors[passwordStrength.color] || 'text-slate-400'}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={inputWithIconLeft + " pr-12"}
                        placeholder="Re-enter your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px] stroke-[1.5]" /> : <Eye className="w-[18px] h-[18px] stroke-[1.5]" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-6 mt-2 border-t border-slate-50 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 focus:ring-4 focus:ring-blue-600/20 outline-none flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    {!isLoading && <UserRoundCheck className="w-[18px] h-[18px] stroke-[1.5]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-slate-600 border border-slate-200/80 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors outline-none focus:ring-4 focus:ring-slate-100"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ========== LOGIN FORM ========== */}
        {flow === 'login' && (
          <form onSubmit={handleLogin} className="p-6 sm:p-8">
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                {/* Login Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      className={inputWithIconLeft}
                      placeholder="jane@example.com"
                      value={loginData.phone}
                      onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                  </div>
                </div>

                {/* Login Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="block text-xs font-medium text-slate-600">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      className={inputWithIconLeft + " pr-12"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 stroke-[1.5]" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-[18px] h-[18px] stroke-[1.5]" /> : <Eye className="w-[18px] h-[18px] stroke-[1.5]" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-6 mt-2 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 focus:ring-4 focus:ring-blue-600/20 outline-none flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                  {!isLoading && <LogIn className="w-[18px] h-[18px] stroke-[1.5]" />}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Register Footer */}
      {flow === 'register' && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setFlow('login'); setRegStep(1); }}
              className="text-slate-900 hover:text-blue-600 transition-colors ml-1 hover:underline underline-offset-4 decoration-2 decoration-blue-200 hover:decoration-blue-600 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}

      {/* Login Footer */}
      {flow === 'login' && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setFlow('register')}
              className="text-slate-900 hover:text-blue-600 transition-colors ml-1 hover:underline underline-offset-4 decoration-2 decoration-blue-200 hover:decoration-blue-600 font-medium"
            >
              Create one here
            </button>
          </p>
        </div>
      )}

      {/* Back to Home Link */}
      <div className="mt-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
          Back to Home
        </Link>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="pl-10"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetEmail("");
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
