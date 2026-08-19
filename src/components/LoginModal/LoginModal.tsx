import { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup';

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const {
    isAuthenticated,
    authError,
    signIn,
    signUp,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onSuccess?.();
    }
  }, [isAuthenticated, isOpen, onSuccess]);

  useEffect(() => {
    if (isOpen) {
      clearAuthError();
      setEmail('');
      setPassword('');
      setMode('login');
    }
  }, [isOpen, clearAuthError]);

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
      } catch {
        // 에러는 authError로 표시됨
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, email, password, signIn, signUp],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <StyledOverlay onClick={handleOverlayClick}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <StyledHeader>
          <StyledTitle>
            {mode === 'login' ? '로그인' : '회원가입'}
          </StyledTitle>
          <StyledCloseButton type="button" onClick={onClose} aria-label="닫기">
            ×
          </StyledCloseButton>
        </StyledHeader>

        <StyledForm onSubmit={handleSubmit}>
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
              autoFocus
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
      </StyledModal>
    </StyledOverlay>
  );
};

export default LoginModal;

const StyledOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ap-overlay);
  z-index: 1000;
  padding: var(--ap-space-6);
`;

const StyledModal = styled.div`
  width: 100%;
  max-width: 360px;
  background: var(--ap-surface);
  border-radius: var(--ap-radius);
  box-shadow: var(--ap-shadow-sheet);
  overflow: hidden;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--ap-space-5) var(--ap-space-6);
  border-bottom: 1px solid var(--ap-border-neutral);
`;

const StyledTitle = styled.h2`
  margin: 0;
  font-size: var(--ap-font-title);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

const StyledCloseButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--ap-text-muted);
  cursor: pointer;
  border-radius: var(--ap-radius-circle);
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: var(--ap-neutral-100);
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  padding: var(--ap-space-5) var(--ap-space-6);
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
