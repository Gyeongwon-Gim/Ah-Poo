import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const getAuthErrorMessage = (error: string): string => {
  if (error.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (error.includes('Email not confirmed')) {
    return '이메일 인증이 필요합니다. 메일함을 확인해주세요.';
  }
  if (error.includes('User already registered')) {
    return '이미 가입된 이메일입니다.';
  }
  if (error.includes('Password should be at least')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  if (error.includes('Invalid email')) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return '인증에 실패했습니다. 다시 시도해주세요.';
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await client.auth.getSession();

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('[Auth] 세션 초기화 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError('Supabase가 설정되지 않았습니다.');
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = getAuthErrorMessage(error.message);
      setAuthError(message);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setAuthError('Supabase가 설정되지 않았습니다.');
      return;
    }

    setAuthError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const message = getAuthErrorMessage(error.message);
      setAuthError(message);
      throw error;
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] 로그아웃 실패:', error);
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      authError,
      signIn,
      signUp,
      signOut,
      clearAuthError,
    }),
    [user, session, isLoading, authError, signIn, signUp, signOut, clearAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
