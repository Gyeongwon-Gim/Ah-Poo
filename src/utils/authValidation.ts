// 회원가입/로그인 폼의 클라이언트 측 유효성 검증.
// 각 함수는 통과하면 null, 실패하면 사용자에게 보여줄 에러 메시지를 반환한다.
// 서버(Supabase 대시보드 Password Requirements)에도 같은 정책을 설정해야 한다.

// Supabase 대시보드: Minimum password length
export const PASSWORD_MIN_LENGTH = 8;

// Supabase 대시보드: Password requirements = Lowercase, uppercase letters, digits and symbols
// 서버(GoTrue)가 "symbol"로 인정하는 문자 목록. 공백·한글 등은 포함되지 않는다.
export const PASSWORD_SYMBOLS = `!@#$%^&*()_+-=[]{};'\\:"|<>?,./\`~`;

export const PASSWORD_POLICY_TEXT = `${PASSWORD_MIN_LENGTH}자 이상, 영문 대·소문자, 숫자, 특수문자를 모두 포함`;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (!normalized) return '이메일을 입력해주세요.';
  if (!EMAIL_PATTERN.test(normalized)) return '올바른 이메일 형식이 아닙니다.';

  return null;
}

// 정책: 8자 이상, 영문 대문자 + 소문자 + 숫자 + 특수문자 조합
export function validatePassword(password: string): string | null {
  const meetsPolicy =
    password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    [...password].some((ch) => PASSWORD_SYMBOLS.includes(ch));

  if (!meetsPolicy) return `비밀번호는 ${PASSWORD_POLICY_TEXT}해야 합니다.`;

  return null;
}

export function validatePasswordConfirm(
  password: string,
  passwordConfirm: string,
): string | null {
  if (!passwordConfirm) return '비밀번호를 한 번 더 입력해주세요.';
  if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';

  return null;
}
