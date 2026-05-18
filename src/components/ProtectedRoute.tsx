import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { IdleTimerProvider } from '@/components/IdleTimerProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth(true);
  const { role, loading: roleLoading } = useUserRole(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }

      if (role && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard based on actual role
        const dashboardPath = 
          role === 'admin' ? '/dashboard/admin' :
          role === 'doctor' ? '/dashboard/doctor' : 
          '/dashboard/patient';
        navigate(dashboardPath);
      }
    }
  }, [user, role, authLoading, roleLoading, navigate, allowedRoles]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    return null;
  }

  // Wrap with idle timer if it's an admin route
  const isAdminRoute = role === 'admin';

  return (
    <IdleTimerProvider enabled={isAdminRoute}>
      {children}
    </IdleTimerProvider>
  );
};

