import { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '@/contexts/AuthContext';
import {
  PASSWORD_POLICY_TEXT,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '@/utils/authValidation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup';

interface FieldErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

const validateFields = (
  mode: AuthMode,
  email: string,
  password: string,
  passwordConfirm: string,
): FieldErrors => {
  const errors: FieldErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (mode === 'login') {
    // 로그인은 정책 도입 전 가입한 계정이 있을 수 있어 빈 값만 검사한다.
    if (!password) errors.password = '비밀번호를 입력해주세요.';
    return errors;
  }

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const confirmError = validatePasswordConfirm(password, passwordConfirm);
  if (confirmError) errors.passwordConfirm = confirmError;

  return errors;
};

const hasErrors = (errors: FieldErrors) => Object.values(errors).some(Boolean);

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
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

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
      setPasswordConfirm('');
      setFieldErrors({});
      setConfirmationSentTo(null);
      setMode('login');
    }
  }, [isOpen, clearAuthError]);

  const handleModeChange = useCallback(
    (newMode: AuthMode) => {
      setMode(newMode);
      setPasswordConfirm('');
      setFieldErrors({});
      clearAuthError();
    },
    [clearAuthError],
  );

  // 입력을 고치면 해당 칸의 에러는 지운다. (다시 검사는 제출 시점에)
  const clearFieldError = useCallback((field: keyof FieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const errors = validateFields(mode, email, password, passwordConfirm);
      setFieldErrors(errors);
      if (hasErrors(errors)) return;

      setIsSubmitting(true);

      try {
        if (mode === 'login') {
          await signIn(email, password);
        } else {
          const result = await signUp(email, password);
          if (result === 'confirmation_sent') {
            setConfirmationSentTo(normalizeEmail(email));
          }
        }
      } catch {
        // 에러는 authError로 표시됨
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, email, password, passwordConfirm, signIn, signUp],
  );

  const handleBackToLogin = useCallback(() => {
    setConfirmationSentTo(null);
    setPassword('');
    handleModeChange('login');
  }, [handleModeChange]);

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
            {confirmationSentTo
              ? '메일을 확인해주세요'
              : mode === 'login'
                ? '로그인'
                : '회원가입'}
          </StyledTitle>
          <StyledCloseButton type="button" onClick={onClose} aria-label="닫기">
            ×
          </StyledCloseButton>
        </StyledHeader>

        {confirmationSentTo ? (
          <StyledBody>
            <StyledMessage>
              <strong>{confirmationSentTo}</strong>
              <br />
              위 주소로 인증 메일을 보냈어요.
              <br />
              메일의 링크를 누르면 가입이 완료됩니다.
            </StyledMessage>
            <StyledHint>메일이 보이지 않으면 스팸함도 확인해주세요.</StyledHint>
            <StyledSubmitButton type="button" onClick={handleBackToLogin}>
              로그인으로 돌아가기
            </StyledSubmitButton>
          </StyledBody>
        ) : (
          <StyledForm onSubmit={handleSubmit} noValidate>
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
              <StyledField>
                <StyledInput
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  $invalid={!!fieldErrors.email}
                  autoFocus
                />
                {fieldErrors.email && <StyledFieldError>{fieldErrors.email}</StyledFieldError>}
              </StyledField>

              <StyledField>
                <StyledInput
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  disabled={isSubmitting}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  aria-invalid={!!fieldErrors.password}
                  $invalid={!!fieldErrors.password}
                />
                {fieldErrors.password ? (
                  <StyledFieldError>{fieldErrors.password}</StyledFieldError>
                ) : (
                  mode === 'signup' && <StyledFieldHint>{PASSWORD_POLICY_TEXT}</StyledFieldHint>
                )}
              </StyledField>

              {mode === 'signup' && (
                <StyledField>
                  <StyledInput
                    type="password"
                    placeholder="비밀번호 확인"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      clearFieldError('passwordConfirm');
                    }}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.passwordConfirm}
                    $invalid={!!fieldErrors.passwordConfirm}
                  />
                  {fieldErrors.passwordConfirm && (
                    <StyledFieldError>{fieldErrors.passwordConfirm}</StyledFieldError>
                  )}
                </StyledField>
              )}
            </StyledInputGroup>

            {authError && <StyledError role="alert">{authError}</StyledError>}

            <StyledSubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? '처리 중...'
                : mode === 'login'
                  ? '로그인'
                  : '회원가입'}
            </StyledSubmitButton>
          </StyledForm>
        )}
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

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  padding: var(--ap-space-5) var(--ap-space-6);
`;

const StyledMessage = styled.p`
  margin: 0;
  font-size: var(--ap-font-body-sm);
  line-height: 1.6;
  color: var(--ap-text);
  text-align: center;
  word-break: break-all;
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

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-1);
`;

const StyledInput = styled.input<{ $invalid?: boolean }>`
  width: 100%;
  padding: var(--ap-space-4);
  background: var(--ap-surface);
  border: 1px solid
    ${({ $invalid }) => ($invalid ? 'var(--ap-error)' : 'var(--ap-border-neutral)')};
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-text);

  &::placeholder {
    color: var(--ap-text-muted);
  }

  &:focus {
    outline: none;
    border-color: ${({ $invalid }) => ($invalid ? 'var(--ap-error)' : 'var(--ap-primary)')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledFieldError = styled.p`
  margin: 0;
  padding: 0 var(--ap-space-1);
  font-size: var(--ap-font-caption);
  color: var(--ap-error);
`;

const StyledFieldHint = styled.p`
  margin: 0;
  padding: 0 var(--ap-space-1);
  font-size: var(--ap-font-caption);
  color: var(--ap-text-muted);
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
