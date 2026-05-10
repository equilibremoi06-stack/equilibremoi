import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getCurrentUser,
  getCurrentUserAccess,
  getStoredAuthUserSnapshot,
  resolveUserAccess,
  type ProfileAccessRow,
  type UserAccess,
} from '../lib/authFlow';
import { getSupabase } from '../lib/supabaseClient';

type UserAccessContextValue = {
  user: User | null;
  access: UserAccess;
  profile: ProfileAccessRow | null;
  loading: boolean;
  refreshAccess: () => Promise<void>;
};

const UserAccessContext = createContext<UserAccessContextValue | null>(null);

export function UserAccessProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<UserAccess>(() => resolveUserAccess(getStoredAuthUserSnapshot()));
  const [profile, setProfile] = useState<ProfileAccessRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccess = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCurrentUserAccess();
      setUser(result.user);
      setAccess(result.access);
      setProfile(result.profile);
    } catch {
      const sessionUser = await getCurrentUser();
      const snapshot = sessionUser ?? getStoredAuthUserSnapshot();
      setUser(sessionUser);
      setAccess(resolveUserAccess(snapshot));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccess();
    if (!supabase) return undefined;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refreshAccess();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase, refreshAccess]);

  const value = useMemo(
    () => ({ user, access, profile, loading, refreshAccess }),
    [user, access, profile, loading, refreshAccess]
  );

  return <UserAccessContext.Provider value={value}>{children}</UserAccessContext.Provider>;
}

export function useUserAccess(): UserAccessContextValue {
  const ctx = useContext(UserAccessContext);
  if (!ctx) {
    throw new Error('useUserAccess must be used within UserAccessProvider');
  }
  return ctx;
}
