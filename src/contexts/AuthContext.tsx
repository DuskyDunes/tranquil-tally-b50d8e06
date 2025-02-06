
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('approval_status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile?.approval_status !== 'approved') {
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Your account is pending approval. Please wait for an admin to approve your account.",
              });
            }
          } else if (mounted) {
            setUser(session.user);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('approval_status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile?.approval_status !== 'approved') {
            await supabase.auth.signOut();
            if (mounted) {
              setUser(null);
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Your account is pending approval. Please wait for an admin to approve your account.",
              });
            }
          } else if (mounted) {
            setUser(session.user);
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const login = async (email: string, password: string) => {
    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.approval_status !== 'approved') {
          await supabase.auth.signOut();
          throw new Error('Your account is pending approval. Please wait for an admin to approve your account.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
