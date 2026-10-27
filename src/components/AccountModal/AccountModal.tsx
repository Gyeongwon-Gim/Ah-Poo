import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styled from '@emotion/styled';
import { Lock, Mail, User, X } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from '@/utils/auth';

interface AccountModalContextValue {
  openAccount: (onAuthenticated?: () => void) => void;
}

const AccountModalContext = createContext<AccountModalContextValue | null>(
  null,
);

type GuestView = 'login' | 'signup' | 'forgot' | 'forgotSent' | 'confirm';

type FieldKey =
  | 'email'
  | 'nickname'
  | 'password'
  | 'confirm'
  | 'current'
  | 'next'
  | 'nextConfirm';

const GUEST_COPY: Record<'login' | 'signup' | 'forgot' | 'confirm', string> = {
  login: '나만의 생생한 후기를 남겨볼까요?',
  signup: '어푸에 오신 것을 환영합니다',
  forgot: '메일로 비밀번호를 다시 정해요',
  confirm: '메일함을 확인해 주세요',
};

export const useAccountModal = () => {
  const ctx = useContext(AccountModalContext);
  if (!ctx) {
    throw new Error('useAccountModal must be used within AccountModalProvider');
  }
  return ctx;
};

export const AccountModalProvider = ({ children }: { children: ReactNode }) => {
  const { needsPasswordReset } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const onAuthenticatedRef = useRef<(() => void) | undefined>(undefined);

  const openAccount = useCallback((onAuthenticated?: () => void) => {
    onAuthenticatedRef.current = onAuthenticated;
    setIsOpen(true);
  }, []);

  const closeAccount = useCallback(() => {
    if (needsPasswordReset) return;
    onAuthenticatedRef.current = undefined;
    setIsOpen(false);
  }, [needsPasswordReset]);

  const finishAuthenticated = useCallback(() => {
    const callback = onAuthenticatedRef.current;
    onAuthenticatedRef.current = undefined;
    setIsOpen(false);
    callback?.();
  }, []);

  return (
    <AccountModalContext.Provider value={{ openAccount }}>
      {children}
      <AccountModal
        isOpen={isOpen || needsPasswordReset}
        forced={needsPasswordReset}
        onClose={closeAccount}
        onAuthenticated={finishAuthenticated}
      />
    </AccountModalContext.Provider>
  );
};

interface AccountModalProps {
  isOpen: boolean;
  forced: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

const AccountModal = ({
  isOpen,
  forced,
  onClose,
  onAuthenticated,
}: AccountModalProps) => {
  const {
    user,
    nickname,
    isAuthenticated,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    updateNickname,
    deleteAccount,
    signOut,
  } = useAuth();

  const [guestView, setGuestView] = useState<GuestView>('login');
  const [email, setEmail] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [nextConfirm, setNextConfirm] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const nicknameTouchedRef = useRef(false);

  const clearFeedback = useCallback(() => {
    setErrors({});
    setFormError(null);
    setFormMessage(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setGuestView('login');
      setPassword('');
      setConfirm('');
      setCurrentPassword('');
      setNextPassword('');
      setNextConfirm('');
      clearFeedback();
      setShowDeleteConfirm(false);
      nicknameTouchedRef.current = false;
      setNicknameDraft(nickname ?? '');
      return;
    }
    if (!nicknameTouchedRef.current) setNicknameDraft(nickname ?? '');
  }, [isOpen, nickname, clearFeedback]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const blurFocusedField = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        active.blur();
      }
    };

    blurFocusedField();
    const frame = requestAnimationFrame(blurFocusedField);
    const timer = window.setTimeout(blurFocusedField, 0);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || forced) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, forced, onClose]);

  const setField = (key: FieldKey, value: string) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
    setFormMessage(null);
    if (key === 'email') setEmail(value);
    if (key === 'nickname') {
      nicknameTouchedRef.current = true;
      setNicknameDraft(value);
    }
    if (key === 'password') setPassword(value);
    if (key === 'confirm') setConfirm(value);
    if (key === 'current') setCurrentPassword(value);
    if (key === 'next') setNextPassword(value);
    if (key === 'nextConfirm') setNextConfirm(value);
  };

  const run = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await action();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : '인증에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = () => {
    const emailError = validateEmail(email);
    const passwordError = password ? '' : '비밀번호를 입력해 주세요.';
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    void run(async () => {
      await signIn(email.trim(), password);
      onAuthenticated();
    });
  };

  const submitSignup = () => {
    const nextErrors = {
      email: validateEmail(email),
      nickname: validateNickname(nicknameDraft),
      password: validatePassword(password),
      confirm: validatePasswordConfirm(password, confirm),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    void run(async () => {
      const status = await signUp(email.trim(), password, nicknameDraft);
      if (status === 'confirmation_sent') {
        setPendingEmail(email.trim());
        setGuestView('confirm');
        setPassword('');
        setConfirm('');
        return;
      }
      onAuthenticated();
    });
  };

  const submitForgot = () => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    if (emailError) return;

    void run(async () => {
      await requestPasswordReset(email.trim());
      setPendingEmail(email.trim());
      setGuestView('forgotSent');
    });
  };

  const submitNickname = () => {
    const nicknameError = validateNickname(nicknameDraft);
    setErrors({ nickname: nicknameError });
    if (nicknameError) return;

    void run(async () => {
      await updateNickname(nicknameDraft);
      setFormMessage('저장했습니다.');
    });
  };

  const submitPasswordChange = () => {
    const nextErrors = {
      current: currentPassword ? '' : '현재 비밀번호를 입력해 주세요.',
      next: validatePassword(nextPassword),
      nextConfirm: validatePasswordConfirm(nextPassword, nextConfirm),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    const emailAddress = user?.email;
    if (!emailAddress) {
      setFormError('이메일 정보가 없습니다.');
      return;
    }

    void run(async () => {
      await signIn(emailAddress, currentPassword);
      await updatePassword(nextPassword);
      setCurrentPassword('');
      setNextPassword('');
      setNextConfirm('');
      setFormMessage('변경했습니다.');
    });
  };

  const submitRecovery = () => {
    const nextErrors = {
      next: validatePassword(nextPassword),
      nextConfirm: validatePasswordConfirm(nextPassword, nextConfirm),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    void run(async () => {
      await updatePassword(nextPassword);
      setNextPassword('');
      setNextConfirm('');
      onClose();
    });
  };

  const submitDelete = () => {
    void run(async () => {
      await deleteAccount();
      setShowDeleteConfirm(false);
      onClose();
    });
  };

  if (!isOpen) return null;

  const showAccount = isAuthenticated && !forced;
  const guestLine =
    guestView === 'forgotSent' ? GUEST_COPY.forgot : GUEST_COPY[guestView];

  return (
    <StyledOverlay
      onClick={(event) => {
        if (event.target === event.currentTarget && !forced) onClose();
      }}
    >
      <StyledModal
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        {forced ? (
          <GuestHeader
            id="account-modal-title"
            line="새 비밀번호를 저장해 주세요"
          />
        ) : showAccount ? (
          <StyledAccountHead>
            <StyledTitle id="account-modal-title">계정</StyledTitle>
            <StyledClose type="button" onClick={onClose} aria-label="닫기">
              <X size={18} />
            </StyledClose>
          </StyledAccountHead>
        ) : (
          <GuestHeader
            id="account-modal-title"
            line={guestLine}
            onClose={onClose}
          />
        )}

        {forced ? (
          <StyledForm
            onSubmit={(event) => {
              event.preventDefault();
              submitRecovery();
            }}
          >
            <IconField
              label="새 비밀번호"
              icon={<Lock size={18} />}
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호, 8자 이상"
              value={nextPassword}
              error={errors.next}
              disabled={isSubmitting}
              onChange={(value) => setField('next', value)}
            />
            <IconField
              label="새 비밀번호 확인"
              icon={<Lock size={18} />}
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 한 번 더"
              value={nextConfirm}
              error={errors.nextConfirm}
              disabled={isSubmitting}
              onChange={(value) => setField('nextConfirm', value)}
            />
            {formError && <StyledError>{formError}</StyledError>}
            <StyledSubmit type="submit" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : '비밀번호 저장'}
            </StyledSubmit>
          </StyledForm>
        ) : showAccount ? (
          <StyledBody>
            <StyledProfile>
              <StyledAvatar>
                {(nickname ?? user?.email ?? '?').at(0)?.toUpperCase()}
              </StyledAvatar>
              <StyledProfileText>
                <strong>{nickname || '닉네임 없음'}</strong>
                <span>{user?.email}</span>
              </StyledProfileText>
            </StyledProfile>
            {formMessage && <StyledOk>{formMessage}</StyledOk>}

            <StyledForm
              onSubmit={(event) => {
                event.preventDefault();
                submitNickname();
              }}
            >
              <LabeledField
                label="닉네임"
                value={nicknameDraft}
                error={errors.nickname}
                disabled={isSubmitting}
                onChange={(value) => setField('nickname', value)}
              />
              <StyledSubmit type="submit" disabled={isSubmitting}>
                닉네임 저장
              </StyledSubmit>
            </StyledForm>

            <StyledForm
              onSubmit={(event) => {
                event.preventDefault();
                submitPasswordChange();
              }}
            >
              <StyledSection>비밀번호 변경</StyledSection>
              <LabeledField
                label="현재 비밀번호"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                error={errors.current}
                disabled={isSubmitting}
                onChange={(value) => setField('current', value)}
              />
              <LabeledField
                label="새 비밀번호"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상"
                value={nextPassword}
                error={errors.next}
                disabled={isSubmitting}
                onChange={(value) => setField('next', value)}
              />
              <LabeledField
                label="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                value={nextConfirm}
                error={errors.nextConfirm}
                disabled={isSubmitting}
                onChange={(value) => setField('nextConfirm', value)}
              />
              {formError && <StyledError>{formError}</StyledError>}
              <StyledSubmit type="submit" disabled={isSubmitting}>
                비밀번호 변경
              </StyledSubmit>
            </StyledForm>

            <StyledSecondary
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                void run(async () => {
                  await signOut();
                  onClose();
                });
              }}
            >
              로그아웃
            </StyledSecondary>
            <StyledDanger
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowDeleteConfirm(true)}
            >
              계정 삭제
            </StyledDanger>
          </StyledBody>
        ) : guestView === 'confirm' || guestView === 'forgotSent' ? (
          <StyledBody>
            <StyledHint>
              {pendingEmail || '입력한 주소'} 로{' '}
              {guestView === 'confirm' ? '링크를 보냈어요.' : '보냈어요.'}
            </StyledHint>
            <StyledSubmit type="button" onClick={() => setGuestView('login')}>
              돌아가기
            </StyledSubmit>
          </StyledBody>
        ) : (
          <StyledBody>
            <StyledForm
              onSubmit={(event) => {
                event.preventDefault();
                if (guestView === 'login') submitLogin();
                if (guestView === 'signup') submitSignup();
                if (guestView === 'forgot') submitForgot();
              }}
            >
              <IconField
                label="이메일"
                icon={<Mail size={18} />}
                type="email"
                autoComplete="email"
                placeholder="이메일 주소"
                value={email}
                error={errors.email}
                disabled={isSubmitting}
                onChange={(value) => setField('email', value)}
              />
              {guestView === 'signup' && (
                <IconField
                  label="닉네임"
                  icon={<User size={18} />}
                  placeholder="닉네임"
                  value={nicknameDraft}
                  error={errors.nickname}
                  disabled={isSubmitting}
                  onChange={(value) => setField('nickname', value)}
                />
              )}
              {guestView !== 'forgot' && (
                <IconField
                  label="비밀번호"
                  icon={<Lock size={18} />}
                  type="password"
                  autoComplete={
                    guestView === 'login' ? 'current-password' : 'new-password'
                  }
                  placeholder={
                    guestView === 'signup' ? '비밀번호, 8자 이상' : '비밀번호'
                  }
                  value={password}
                  error={errors.password}
                  disabled={isSubmitting}
                  onChange={(value) => setField('password', value)}
                />
              )}
              {guestView === 'signup' && (
                <IconField
                  label="비밀번호 확인"
                  icon={<Lock size={18} />}
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호 재확인"
                  value={confirm}
                  error={errors.confirm}
                  disabled={isSubmitting}
                  onChange={(value) => setField('confirm', value)}
                />
              )}
              {formError && <StyledError>{formError}</StyledError>}
              <StyledSubmit type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? '처리 중...'
                  : guestView === 'login'
                    ? '로그인'
                    : guestView === 'signup'
                      ? '가입하기'
                      : '메일 보내기'}
              </StyledSubmit>
            </StyledForm>

            {guestView === 'login' && (
              <StyledTextButton
                type="button"
                onClick={() => {
                  setGuestView('forgot');
                  clearFeedback();
                }}
              >
                비밀번호가 기억나지 않아요
              </StyledTextButton>
            )}
            {guestView === 'login' && (
              <StyledSwitch>
                <StyledHint>아직 계정이 없다면?</StyledHint>
                <StyledSignupLink
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setGuestView('signup');
                    clearFeedback();
                  }}
                >
                  회원가입
                </StyledSignupLink>
              </StyledSwitch>
            )}
            {guestView === 'signup' && (
              <StyledTextButton
                type="button"
                onClick={() => {
                  setGuestView('login');
                  clearFeedback();
                }}
              >
                로그인
              </StyledTextButton>
            )}
            {guestView === 'forgot' && (
              <StyledTextButton
                type="button"
                onClick={() => {
                  setGuestView('login');
                  clearFeedback();
                }}
              >
                돌아가기
              </StyledTextButton>
            )}
          </StyledBody>
        )}
      </StyledModal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="리뷰와 수영 기록이 함께 삭제됩니다."
        confirmLabel="삭제"
        danger
        onConfirm={submitDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </StyledOverlay>
  );
};

const GuestHeader = ({
  id,
  line,
  onClose,
}: {
  id: string;
  line: string;
  onClose?: () => void;
}) => (
  <StyledGuestHead>
    {onClose ? (
      <StyledClose type="button" onClick={onClose} aria-label="닫기">
        <X size={18} />
      </StyledClose>
    ) : (
      <span />
    )}
    <StyledBrand>
      <StyledMark src="/icon.svg" alt="" />
      <StyledWord>Ah-Poo!</StyledWord>
      <StyledLine id={id}>{line}</StyledLine>
    </StyledBrand>
  </StyledGuestHead>
);

const useTapToEdit = () => {
  const [editable, setEditable] = useState(false);

  const enable = (event: { currentTarget: HTMLInputElement }) => {
    event.currentTarget.readOnly = false;
    setEditable(true);
  };

  return {
    readOnly: !editable,
    onPointerDown: enable,
    onKeyDown: enable,
  };
};

const IconField = ({
  label,
  icon,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) => {
  const tapToEdit = useTapToEdit();

  return (
    <StyledField>
      <StyledIconInput>
        {icon}
        <input
          aria-label={label}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          readOnly={tapToEdit.readOnly}
          onPointerDown={tapToEdit.onPointerDown}
          onKeyDown={tapToEdit.onKeyDown}
          onChange={(event) => onChange(event.target.value)}
        />
      </StyledIconInput>
      {error && <StyledError>{error}</StyledError>}
    </StyledField>
  );
};

const LabeledField = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) => {
  const tapToEdit = useTapToEdit();

  return (
    <StyledField>
      <StyledLabel>
        {label}
        <input
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          readOnly={tapToEdit.readOnly}
          onPointerDown={tapToEdit.onPointerDown}
          onKeyDown={tapToEdit.onKeyDown}
          onChange={(event) => onChange(event.target.value)}
        />
      </StyledLabel>
      {error && <StyledError>{error}</StyledError>}
    </StyledField>
  );
};

const StyledOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ap-space-6);
  background: var(--ap-overlay);
`;

const StyledModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  width: 100%;
  max-width: 360px;
  max-height: calc(100% - 24px);
  overflow: auto;
  padding: var(--ap-space-5) var(--ap-space-6) var(--ap-space-6);
  background: var(--ap-surface);
  border-radius: var(--ap-radius);
  box-shadow: var(--ap-shadow-sheet);
`;

const StyledGuestHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

const StyledBrand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ap-space-2);
  text-align: center;
`;

const StyledMark = styled.img`
  width: 64px;
  height: 64px;
  border-radius: var(--ap-radius);
`;

const StyledWord = styled.span`
  font-family: var(--ap-font-display);
  font-size: var(--ap-font-title-lg);
  line-height: 1;
  color: var(--ap-primary);
`;

const StyledLine = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  line-height: 1.45;
  color: var(--ap-text);
`;

const StyledAccountHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StyledTitle = styled.h2`
  margin: 0;
  font-size: var(--ap-font-title);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

const StyledClose = styled.button`
  align-self: flex-end;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--ap-radius-circle);
  background: transparent;
  color: var(--ap-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--ap-neutral-100);
  }
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-2);
`;

const StyledIconInput = styled.span`
  display: flex;
  align-items: center;
  gap: var(--ap-space-3);
  min-height: 48px;
  padding: 0 var(--ap-space-5);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  color: var(--ap-text-muted);

  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--ap-text);
    font-size: var(--ap-font-body);
  }

  input:focus {
    outline: none;
  }

  &:focus-within {
    border-color: var(--ap-primary);
  }
`;

const StyledLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-2);
  color: var(--ap-text);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);

  input {
    min-height: 44px;
    padding: var(--ap-space-4);
    border: 1px solid var(--ap-border-neutral);
    border-radius: var(--ap-radius-sm);
    color: var(--ap-text);
    font-size: var(--ap-font-body);
    font-weight: var(--ap-font-weight-normal);
  }

  input:focus {
    outline: none;
    border-color: var(--ap-primary);
  }
`;

const StyledError = styled.p`
  margin: 0;
  padding: var(--ap-space-3);
  border-radius: var(--ap-radius-sm);
  background: var(--ap-error-bg);
  color: var(--ap-error);
  font-size: var(--ap-font-body-sm);
  text-align: center;
`;

const StyledOk = styled.p`
  margin: 0;
  color: var(--ap-success-dark);
  font-size: var(--ap-font-body-sm);
  text-align: center;
`;

const StyledSubmit = styled.button`
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: var(--ap-radius-sm);
  background: var(--ap-primary);
  color: white;
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--ap-primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledSwitch = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ap-space-2);
`;

const StyledSignupLink = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  color: var(--ap-text-muted);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-normal);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledSecondary = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  background: var(--ap-surface);
  color: var(--ap-text-muted);
  font-size: var(--ap-font-body);
  cursor: pointer;
`;

const StyledDanger = styled(StyledSecondary)`
  color: var(--ap-error);
`;

const StyledTextButton = styled.button`
  align-self: center;
  border: none;
  background: transparent;
  color: var(--ap-primary-dark);
  font-size: var(--ap-font-body-sm);
  cursor: pointer;
`;

const StyledHint = styled.p`
  margin: 0;
  color: var(--ap-text-muted);
  font-size: var(--ap-font-body-sm);
  line-height: 1.5;
  text-align: center;
`;

const StyledProfile = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ap-space-3);
`;

const StyledAvatar = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ap-radius-circle);
  background: var(--ap-primary);
  color: white;
  font-weight: var(--ap-font-weight-semibold);
`;

const StyledProfileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    color: var(--ap-text);
    font-size: var(--ap-font-body);
  }

  span {
    overflow: hidden;
    color: var(--ap-text-muted);
    font-size: var(--ap-font-body-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StyledSection = styled.p`
  margin: var(--ap-space-2) 0 0;
  color: var(--ap-text);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-semibold);
`;
