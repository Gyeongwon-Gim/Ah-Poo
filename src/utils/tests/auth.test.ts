import { describe, expect, it } from 'vitest';
import {
  toAuthErrorMessage,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from '../auth';

describe('validateEmail', () => {
  it('빈 값이면 입력을 요청한다', () => {
    expect(validateEmail('  ')).toBe('이메일을 입력해 주세요.');
  });

  it('형식이 아니면 안내한다', () => {
    expect(validateEmail('swim')).toBe('올바른 이메일 형식이 아닙니다.');
  });

  it('올바른 주소는 통과한다', () => {
    expect(validateEmail(' swim@ah-poo.kr ')).toBe('');
  });
});

describe('validateNickname', () => {
  it('빈 값이면 입력을 요청한다', () => {
    expect(validateNickname('')).toBe('닉네임을 입력해 주세요.');
  });

  it('20자를 넘으면 안내한다', () => {
    expect(validateNickname('가'.repeat(21))).toBe('닉네임은 20자까지 입력할 수 있습니다.');
  });

  it('1자 이상 20자 이하는 통과한다', () => {
    expect(validateNickname(' 한강돌핀 ')).toBe('');
  });
});

describe('validatePassword', () => {
  it('빈 값이면 입력을 요청한다', () => {
    expect(validatePassword('')).toBe('비밀번호를 입력해 주세요.');
  });

  it('8자 미만이면 안내한다', () => {
    expect(validatePassword('short')).toBe('비밀번호는 8자 이상이어야 합니다.');
  });

  it('8자 이상은 통과한다', () => {
    expect(validatePassword('longpass')).toBe('');
  });
});

describe('validatePasswordConfirm', () => {
  it('확인 값이 없으면 다시 입력을 요청한다', () => {
    expect(validatePasswordConfirm('longpass', '')).toBe('비밀번호를 다시 입력해 주세요.');
  });

  it('서로 다르면 안내한다', () => {
    expect(validatePasswordConfirm('longpass', 'otherpas')).toBe('비밀번호가 서로 다릅니다.');
  });

  it('같으면 통과한다', () => {
    expect(validatePasswordConfirm('longpass', 'longpass')).toBe('');
  });
});

describe('toAuthErrorMessage', () => {
  it('로그인 실패를 한국어로 옮긴다', () => {
    expect(toAuthErrorMessage({ message: 'Invalid login credentials' })).toBe(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    );
  });

  it('서버가 알린 최소 길이를 그대로 보여 준다', () => {
    expect(
      toAuthErrorMessage({ message: 'Password should be at least 6 characters' }),
    ).toBe('비밀번호는 최소 6자 이상이어야 합니다.');
  });

  it('닉네임 중복을 한국어로 옮긴다', () => {
    expect(
      toAuthErrorMessage({
        message: 'duplicate key value violates unique constraint "profiles_nickname_unique"',
      }),
    ).toBe('이미 사용 중인 닉네임입니다.');
  });

  it('모르는 오류는 공통 문구로 돌려준다', () => {
    expect(toAuthErrorMessage({ message: 'something else' })).toBe(
      '인증에 실패했습니다. 다시 시도해주세요.',
    );
  });
});
