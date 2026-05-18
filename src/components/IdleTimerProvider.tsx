import React, { useCallback } from 'react';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface IdleTimerProviderProps {
  children: React.ReactNode;
  timeout?: number; // In milliseconds
  enabled?: boolean;
}

/**
 * A provider component that signs out the user after a period of inactivity.
 * Only triggers if 'enabled' is true.
 */
export const IdleTimerProvider = ({ 
  children, 
  timeout = 5 * 60 * 1000, 
  enabled = false 
}: IdleTimerProviderProps) => {


  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleIdle = useCallback(() => {
    if (enabled) {
      toast({
        title: "Session Expired",
        description: "You have been signed out due to 5 minutes of inactivity.",
        variant: "destructive"
      });
      signOut();
    }
  }, [signOut, toast, enabled]);

  useIdleTimer(timeout, handleIdle, enabled);

  return <>{children}</>;
};
