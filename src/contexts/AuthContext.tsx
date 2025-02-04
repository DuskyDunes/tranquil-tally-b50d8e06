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
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('id', session.user.id)
          .single();

        if (profile?.approval_status !== 'approved') {
          await supabase.auth.signOut();
          setUser(null);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Your account is pending approval. Please wait for an admin to approve your account.",
          });
        } else {
          setUser(session.user);
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('id', session.user.id)
          .single();

        if (profile?.approval_status !== 'approved') {
          await supabase.auth.signOut();
          setUser(null);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Your account is pending approval. Please wait for an admin to approve your account.",
          });
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string) => {
    const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) throw signInError;

    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', authUser.id)
        .single();

      if (profile?.approval_status !== 'approved') {
        await supabase.auth.signOut();
        throw new Error('Your account is pending approval. Please wait for an admin to approve your account.');
      }
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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