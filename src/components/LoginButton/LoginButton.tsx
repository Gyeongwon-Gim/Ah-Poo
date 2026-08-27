import { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import Skeleton from '@/components/Skeleton/Skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

type AuthMode = 'login' | 'signup';

const LoginButton = ({ className }: LoginButtonProps) => {
  const {
    user,
    isLoading,
    isAuthenticated,
    authError,
    signIn,
    signUp,
    signOut,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModeChange = useCallback(
    (newMode: AuthMode) => {
      setMode(newMode);
      clearAuthError();
    },
    [clearAuthError],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim() || !password.trim()) return;

      setIsSubmitting(true);

      try {
        if (mode === 'login') {
          await signIn(email, password);
        } else {
          await signUp(email, password);
        }
        setEmail('');
        setPassword('');
      } catch {
        // 에러는 authError로 표시됨
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, email, password, signIn, signUp],
  );

  if (isLoading) {
    return <Skeleton className={className} height="180px" />;
  }

  if (isAuthenticated && user) {
    return (
      <StyledProfileContainer className={className}>
        <StyledProfileInfo>
          <StyledAvatar>{(user.email?.[0] ?? '?').toUpperCase()}</StyledAvatar>
          <StyledProfileEmail>{user.email}</StyledProfileEmail>
        </StyledProfileInfo>
        <StyledLogoutButton type="button" onClick={signOut}>
          로그아웃
        </StyledLogoutButton>
      </StyledProfileContainer>
    );
  }

  return (
    <StyledForm className={className} onSubmit={handleSubmit}>
      <StyledTabs>
        <StyledTab
          type="button"
          $active={mode === 'login'}
          onClick={() => handleModeChange('login')}
        >
          로그인
        </StyledTab>
        <StyledTab
          type="button"
          $active={mode === 'signup'}
          onClick={() => handleModeChange('signup')}
        >
          회원가입
        </StyledTab>
      </StyledTabs>

      <StyledInputGroup>
        <StyledInput
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
        />
        <StyledInput
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </StyledInputGroup>

      {authError && <StyledError>{authError}</StyledError>}

      <StyledSubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? '처리 중...'
          : mode === 'login'
            ? '로그인'
            : '회원가입'}
      </StyledSubmitButton>

      {mode === 'signup' && (
        <StyledHint>
          가입 후 이메일 인증이 필요할 수 있습니다.
        </StyledHint>
      )}
    </StyledForm>
  );
};

export default LoginButton;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  width: 100%;
`;

const StyledTabs = styled.div`
  display: flex;
  gap: var(--ap-space-1);
  padding: var(--ap-space-1);
  background: var(--ap-neutral-100);
  border-radius: var(--ap-radius-sm);
`;

const StyledTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: var(--ap-space-3);
  background: ${({ $active }) => ($active ? 'var(--ap-surface)' : 'transparent')};
  border: none;
  border-radius: var(--ap-radius-xs);
  font-size: var(--ap-font-body-sm);
  font-weight: ${({ $active }) =>
    $active ? 'var(--ap-font-weight-semibold)' : 'var(--ap-font-weight-normal)'};
  color: ${({ $active }) => ($active ? 'var(--ap-text)' : 'var(--ap-text-muted)')};
  cursor: pointer;
  transition:
    background-color var(--ap-duration-fast) var(--ap-ease-out),
    color var(--ap-duration-fast) var(--ap-ease-out);
`;

const StyledInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

const StyledInput = styled.input`
  width: 100%;
  padding: var(--ap-space-4);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-text);

  &::placeholder {
    color: var(--ap-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--ap-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledError = styled.p`
  margin: 0;
  padding: var(--ap-space-3);
  background: var(--ap-error-bg);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  color: var(--ap-error);
  text-align: center;
`;

const StyledSubmitButton = styled.button`
  width: 100%;
  padding: var(--ap-space-4);
  background: var(--ap-primary);
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledHint = styled.p`
  margin: 0;
  font-size: var(--ap-font-caption);
  color: var(--ap-text-muted);
  text-align: center;
`;

const StyledProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  padding: var(--ap-space-4);
  background: var(--ap-neutral-50);
  border-radius: var(--ap-radius-sm);
`;

const StyledProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ap-space-3);
`;

const StyledAvatar = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ap-primary);
  border-radius: var(--ap-radius-circle);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-semibold);
  color: white;
`;

const StyledProfileEmail = styled.span`
  font-size: var(--ap-font-body-sm);
  color: var(--ap-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLogoutButton = styled.button`
  width: 100%;
  padding: var(--ap-space-3);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  color: var(--ap-text-muted);
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: var(--ap-neutral-100);
  }
`;
