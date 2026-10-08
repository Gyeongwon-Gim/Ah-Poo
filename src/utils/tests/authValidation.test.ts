import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../authValidation';

describe('normalizeEmail', () => {
  it('앞뒤 공백을 제거하고 소문자로 바꾼다', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('validateEmail', () => {
  it('올바른 이메일은 통과한다', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('앞뒤 공백이 있어도 통과한다', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });

  it('빈 값이면 에러를 반환한다', () => {
    expect(validateEmail('   ')).not.toBeNull();
  });

  it.each(['user', 'user@', 'user@example', '@example.com', 'us er@example.com'])(
    '형식이 틀린 %s 는 에러를 반환한다',
    (email) => {
      expect(validateEmail(email)).not.toBeNull();
    },
  );
});

describe('validatePassword', () => {
  it('8자 이상 + 대문자 + 소문자 + 숫자 + 특수문자 조합은 통과한다', () => {
    expect(validatePassword('Abcdef1!')).toBeNull();
  });

  it.each(['Abcdef1_', 'Abcdef1~', 'Abcdef1"', 'Abcdef1\\'])(
    'Supabase가 인정하는 특수문자 %s 를 포함하면 통과한다',
    (password) => {
      expect(validatePassword(password)).toBeNull();
    },
  );

  it.each([
    ['빈 값', ''],
    ['8자 미만', 'Abcd1!'],
    ['대문자 없음', 'abcdef1!'],
    ['소문자 없음', 'ABCDEF1!'],
    ['숫자 없음', 'Abcdefg!'],
    ['특수문자 없음', 'Abcdefg1'],
    ['공백은 특수문자로 인정하지 않음', 'Abcdef1 '],
    ['한글은 특수문자로 인정하지 않음', 'Abcdef1가'],
  ])('%s 이면 에러를 반환한다', (_label, password) => {
    expect(validatePassword(password)).not.toBeNull();
  });
});

describe('validatePasswordConfirm', () => {
  it('두 비밀번호가 같으면 통과한다', () => {
    expect(validatePasswordConfirm('Abcdef1!', 'Abcdef1!')).toBeNull();
  });

  it('확인 칸이 비어 있으면 에러를 반환한다', () => {
    expect(validatePasswordConfirm('Abcdef1!', '')).not.toBeNull();
  });

  it('두 비밀번호가 다르면 에러를 반환한다', () => {
    expect(validatePasswordConfirm('Abcdef1!', 'Abcdef1@')).not.toBeNull();
  });
});
