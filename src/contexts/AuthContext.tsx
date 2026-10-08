import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  isAuthRetryableFetchError,
  type AuthError,
  type Session,
  type User,
} from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizeEmail, PASSWORD_POLICY_TEXT } from '@/utils/authValidation';

// supabase-js v2의 error.code 기준으로 분기한다. (영문 메시지는 바뀔 수 있음)
const getAuthErrorMessage = (error: AuthError): string => {
  if (isAuthRetryableFetchError(error)) {
    return '네트워크 연결을 확인한 뒤 다시 시도해주세요.';
  }

  switch (error.code) {
    case 'invalid_credentials':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'email_not_confirmed':
      return '이메일 인증이 필요합니다. 메일함을 확인해주세요.';
    case 'user_already_exists':
    case 'email_exists':
      return '이미 가입된 이메일입니다.';
    case 'weak_password':
      return `비밀번호는 ${PASSWORD_POLICY_TEXT}해야 합니다.`;
    case 'email_address_invalid':
      return '올바른 이메일 형식이 아닙니다.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 'signup_disabled':
      return '현재 회원가입이 중단된 상태입니다.';
    case 'unexpected_failure':
      // SMTP 발송 실패 시 Supabase는 가입 자체를 롤백하고 이 코드를 돌려준다.
      if (error.message.includes('sending confirmation email')) {
        console.error('[Auth] 인증 메일 발송 실패 (SMTP 설정 확인 필요):', error.message);
        return '인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.';
      }
      break;
  }

  // 매핑되지 않은 에러는 원인 파악을 위해 원본을 남긴다.
  console.error('[Auth] 처리되지 않은 인증 에러:', {
    code: error.code,
    status: error.status,
    message: error.message,
  });
  return '인증에 실패했습니다. 다시 시도해주세요.';
};

// signed_in: 바로 로그인됨 (Confirm email 꺼짐)
// confirmation_sent: 인증 메일 확인 필요 (Confirm email 켜짐)
export type SignUpResult = 'signed_in' | 'confirmation_sent';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
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
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!supabase) {
        const message = 'Supabase가 설정되지 않았습니다.';
        setAuthError(message);
        throw new Error(message);
      }

      setAuthError(null);

      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          // 인증 메일 링크를 누른 뒤 돌아올 주소.
          // 대시보드 Authentication > URL Configuration > Redirect URLs에 등록돼 있어야 한다.
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setAuthError(message);
        throw error;
      }

      // Confirm email이 켜져 있으면 인증 전까지 세션이 발급되지 않는다.
      // 이미 가입된 이메일도 에러 없이 identities: []인 user가 오는데,
      // 가입 여부를 노출하지 않기 위해 새 가입과 같은 결과로 처리한다.
      return data.session ? 'signed_in' : 'confirmation_sent';
    },
    [],
  );

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
