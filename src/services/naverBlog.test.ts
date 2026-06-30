import { describe, it, expect } from 'vitest';
import {
  isNetworkFetchError,
  toBlogFetchErrorMessage,
} from './naverBlog';

describe('naverBlog fetch errors', () => {
  it('Failed to fetch를 네트워크 안내 문구로 바꾼다', () => {
    expect(
      toBlogFetchErrorMessage(new TypeError('Failed to fetch')),
    ).toBe('네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
  });

  it('Safari Load failed도 네트워크 오류로 본다', () => {
    expect(isNetworkFetchError(new TypeError('Load failed'))).toBe(true);
    expect(toBlogFetchErrorMessage(new TypeError('Load failed'))).toBe(
      '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    );
  });

  it('타임아웃 메시지를 사용자 친화적으로 바꾼다', () => {
    expect(toBlogFetchErrorMessage(new Error('REQUEST_TIMEOUT'))).toBe(
      '응답 시간이 초과됐어요. 다시 시도해 주세요.',
    );
  });

  it('AbortError는 그대로 전달한다', () => {
    expect(() =>
      toBlogFetchErrorMessage(new DOMException('Aborted', 'AbortError')),
    ).toThrow();
  });

  it('네이버 API 오류는 일시 장애 안내로 바꾼다', () => {
    expect(
      toBlogFetchErrorMessage(new Error('네이버 API 오류 (429)')),
    ).toBe(
      '블로그 검색 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.',
    );
  });
});
