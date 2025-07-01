
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { AuthContext } from '@/types/auth';

const AuthContextObj = createContext<AuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Show toast notifications for auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.message === 'Email not confirmed') {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message === 'Invalid login credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
    
    return true;
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Sign up error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
    
    toast({
      title: "Account Created!",
      description: "Please check your email for a confirmation link to complete your registration.",
    });
    
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Check if user needs onboarding
  const checkUserOnboardingStatus = async (userId: string) => {
    try {
      // Check if user is part of any organization
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('user_id', userId);

      if (orgError) throw orgError;

      // Check if user owns any organization
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', userId);

      if (ownedError) throw ownedError;

      return {
        needsOnboarding: !orgUsers?.length && !ownedOrgs?.length,
        hasOrganizations: (ownedOrgs?.length || 0) > 0,
        isMember: (orgUsers?.length || 0) > 0
      };
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { needsOnboarding: true, hasOrganizations: false, isMember: false };
    }
  };

  return (
    <AuthContextObj.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      signUp,
      checkUserOnboardingStatus
    }}>
      {children}
    </AuthContextObj.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContextObj);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
