import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { deleteOwnReviewImages } from '@/services/account';
import { toAuthErrorMessage, type SignUpStatus } from '@/utils/auth';

const authRedirectUrl = () => `${window.location.origin}/`;

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase가 설정되지 않았습니다.');
  }
  return supabase;
};

const fail = (error: { message: string }): never => {
  throw new Error(toAuthErrorMessage(error));
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  nickname: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsPasswordReset: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<SignUpStatus>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readMetadataNickname = (user: User | null): string | null => {
  const value = user?.user_metadata?.nickname;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return undefined;
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

    void initializeAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !supabase) {
      setNickname(null);
      return undefined;
    }

    const client = supabase;
    const userId = user.id;
    let cancelled = false;
    setNickname(readMetadataNickname(user));

    const loadNickname = async () => {
      const { data, error } = await client
        .from('profiles')
        .select('nickname')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled || error || typeof data?.nickname !== 'string') return;
      setNickname(data.nickname);
    };

    void loadNickname();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = requireClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) fail(error);
  }, []);

  const signUp = useCallback(async (email: string, password: string, nicknameValue: string) => {
    const client = requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: nicknameValue.trim() },
        emailRedirectTo: authRedirectUrl(),
      },
    });

    if (error) fail(error);
    return data.session ? 'authenticated' : 'confirmation_sent';
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const client = requireClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    });
    if (error) fail(error);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = requireClient();
    const { error } = await client.auth.updateUser({ password });
    if (error) fail(error);
    setNeedsPasswordReset(false);
  }, []);

  const updateNickname = useCallback(async (nextNickname: string) => {
    const client = requireClient();
    const {
      data: { user: currentUser },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    const trimmed = nextNickname.trim();
    const { error } = await client
      .from('profiles')
      .update({ nickname: trimmed })
      .eq('id', currentUser.id);

    if (error) fail(error);
    setNickname(trimmed);
  }, []);

  const deleteAccount = useCallback(async () => {
    const client = requireClient();
    const {
      data: { user: currentUser },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    await deleteOwnReviewImages(currentUser.id);

    const { error } = await client.rpc('delete_own_account');
    if (error) fail(error);

    await client.auth.signOut();
  }, []);

  const signOut = useCallback(async () => {
    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) fail(error);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      nickname,
      isLoading,
      isAuthenticated: !!user,
      needsPasswordReset,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      updateNickname,
      deleteAccount,
      signOut,
    }),
    [
      user,
      session,
      nickname,
      isLoading,
      needsPasswordReset,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      updateNickname,
      deleteAccount,
      signOut,
    ],
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
