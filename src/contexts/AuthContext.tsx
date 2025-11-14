import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/integrations/firebase/client";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from "firebase/auth";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: "reporter" | "admin";
  emailVerified: boolean;
} | null;

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const { toast } = useToast();

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [user, updateActivity]);

  // Check for session timeout
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        try {
          await signOut(auth);
          toast({
            title: "Session expired",
            description: "You've been logged out due to inactivity",
            variant: "destructive",
          });
        } catch (error) {
          logger.error('Logout error:', error);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, lastActivity, toast]);

  // Set up Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Create or update profile in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          logger.error('Profile upsert error:', profileError);
          toast({
            title: "Profile sync error",
            description: profileError.message,
            variant: "destructive",
          });
        }

        // Fetch user role from Supabase
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', firebaseUser.uid)
          .maybeSingle();

        if (roleError) {
          logger.error('Role fetch error:', roleError);
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || undefined,
          role: roleData?.role || 'reporter',
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setLoading(true);
      
      // Set persistence based on remember me option
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      
      await signInWithEmailAndPassword(auth, email, password);
      
      setLastActivity(Date.now());

      toast({
        title: "Logged in successfully",
        description: `Welcome back!`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userCredential.user.uid,
          email: email,
          name: name,
        });

      if (profileError) {
        console.error('Profile insert error:', profileError);
      }

      // Assign default 'reporter' role in Supabase
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userCredential.user.uid,
          role: 'reporter'
        });

      if (roleError) {
        console.error('Role insert error:', roleError);
      }

      toast({
        title: "Account created",
        description: "Welcome to CivicSpot!",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (rememberMe: boolean = false): Promise<void> => {
    try {
      setLoading(true);
      
      // Set persistence based on remember me option
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      setLastActivity(Date.now());

      toast({
        title: "Signed in with Google",
        description: "Welcome!",
      });
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const resendVerificationEmail = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error("No user logged in");
      }

      const { sendEmailVerification } = await import("firebase/auth");
      await sendEmailVerification(auth.currentUser);

      toast({
        title: "Verification email sent",
        description: "Please check your inbox and verify your email address.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send verification email",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    signInWithGoogle,
    logout,
    isAdmin,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
