export const MIN_PASSWORD_LENGTH = 8;
export const NICKNAME_MAX_LENGTH = 20;

export type SignUpStatus = 'authenticated' | 'confirmation_sent';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string => {
  const trimmed = email.trim();
  if (!trimmed) return '이메일을 입력해 주세요.';
  if (!EMAIL_PATTERN.test(trimmed)) return '올바른 이메일 형식이 아닙니다.';
  return '';
};

export const validateNickname = (nickname: string): string => {
  const trimmed = nickname.trim();
  if (!trimmed) return '닉네임을 입력해 주세요.';
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MAX_LENGTH}자까지 입력할 수 있습니다.`;
  }
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  }
  return '';
};

export const validatePasswordConfirm = (password: string, confirm: string): string => {
  if (!confirm) return '비밀번호를 다시 입력해 주세요.';
  if (confirm !== password) return '비밀번호가 서로 다릅니다.';
  return '';
};

export const toAuthErrorMessage = (error: { message: string }): string => {
  const { message } = error;
  const lengthMatch = message.match(/at least (\d+)/i);

  if (lengthMatch?.[1]) {
    return `비밀번호는 최소 ${lengthMatch[1]}자 이상이어야 합니다.`;
  }
  if (message.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 필요합니다. 메일함을 확인해주세요.';
  }
  if (message.includes('User already registered')) {
    return '이미 가입된 이메일입니다.';
  }
  if (message.includes('Invalid email') || message.includes('Unable to validate email')) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  if (
    message.includes('profiles_nickname') ||
    message.includes('duplicate key')
  ) {
    return '이미 사용 중인 닉네임입니다.';
  }
  return '인증에 실패했습니다. 다시 시도해주세요.';
};
