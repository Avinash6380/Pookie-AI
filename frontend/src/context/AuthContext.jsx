import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.js';
import { auth as firebaseAuth, googleProvider, isFirebaseConfigured } from '../services/firebase.js';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const hasAccessToken = window.location.hash.includes('access_token=') || window.location.search.includes('access_token=');

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!hasAccessToken || session) {
        setLoading(false);
      }
    });

    // 2. Listen to authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // SignUp function - routes through the backend register API (auto-confirms email)
  const signUp = async (email, password, username) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, username })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to register account');
    }
    return result;
  };

  // Login function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  // Google OAuth sign in function using Firebase Auth with Supabase Exchange
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error("Firebase config is missing. Please set up the Firebase API keys in your frontend .env file.");
    }
    
    // 1. Sign in with Firebase popup
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    
    // 2. Extract Google credentials and tokens
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken;
    const accessToken = credential?.accessToken;
    
    if (!idToken) {
      throw new Error("Failed to retrieve Google ID token from OAuth credential.");
    }

    // 3. Authenticate with Supabase using the ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken
    });

    if (error) throw error;
    return data;
  };

  // Facebook OAuth sign in function
  const signInWithFacebook = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
    return data;
  };

  // Logout function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  // Forgot password reset function
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login` // redirect back to login
    });
    if (error) throw error;
    return data;
  };

  // Fetch authorization headers automatically
  const getAuthHeaders = () => {
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    session,
    loading,
    token: session?.access_token || null,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
