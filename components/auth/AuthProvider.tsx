"use client"; // Client-side component for authentication context

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

// Shape of the authentication context value
type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

// Context for accessing auth state throughout the app
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

// Provides auth state to child components
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to access auth context in components
export function useAuth() {
  return useContext(AuthContext);
}
