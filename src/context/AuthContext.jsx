import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isDemoMode, onAuthChange, signOutUser } from "../data/auth";
import { getProfile } from "../data/store";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthChange(async (nextUser) => {
      if (cancelled) return;
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      let nextProfile = null;
      try {
        nextProfile = await getProfile(nextUser.uid);
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
      if (cancelled) return;
      setUser(nextUser);
      setProfile(nextProfile);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = user;
    if (!current) return;
    const nextProfile = await getProfile(current.uid);
    setProfile(nextProfile);
  }, [user]);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemoMode, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}