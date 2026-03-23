import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/integrations/firebase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = (requireAuth: boolean = false) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Mock a session object to prevent breaking existing components
        const token = await currentUser.getIdToken();
        setSession({
          access_token: token,
          user: currentUser
        });
      } else {
        setSession(null);
      }

      setLoading(false);

      if (requireAuth && !currentUser) {
        navigate(`/auth?redirect=${window.location.pathname}`);
      }
    });

    return () => unsubscribe();
  }, [requireAuth, navigate]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    navigate('/');
  };

  return { user, session, loading, signOut };
};
