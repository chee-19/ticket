import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Department } from '../constants/departments';

const withTimeout = <T,>(p: Promise<T>, ms = 5000) =>
  Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('profile-timeout')), ms)),
  ]);

export type Profile = {
  id: string;
  full_name: string | null;
  department: Department | null;
  created_at: string;
};

export interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('profiles')
            .select('id, full_name, department, created_at')
            .eq('id', userId)
            .maybeSingle(),
          5000
        );
        if (error) {
          console.error('Failed to load profile', error);
          return null;
        }
        return data ?? null;
      } catch (e) {
        console.warn('Profile fetch timed out; proceeding without it', e);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          try {
            const profileData = await loadProfile(initialSession.user.id);
            if (isMounted) {
              setProfile(profileData);
            }
          } catch (err) {
            console.error('Initial profile load failed', err);
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setLoading(true);
        loadProfile(newSession.user.id)
          .then((profileData) => {
            if (isMounted) {
              setProfile(profileData);
            }
          })
          .catch((err) => {
            console.error('Profile fetch after auth state change failed', err);
            if (isMounted) {
              setProfile(null);
            }
          })
          .finally(() => {
            if (isMounted) {
              setLoading(false);
            }
          });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        loadProfile(data.session.user.id)
          .then((profileData) => {
            setProfile(profileData);
          })
          .catch((err) => {
            console.error('Profile fetch after sign-in failed', err);
            setProfile(null);
          });
      }

      return { error };
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out', error);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ loading, session, user, profile, signIn, signOut }),
    [loading, session, user, profile, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
