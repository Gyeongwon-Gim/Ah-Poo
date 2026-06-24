import { describe, it, expect } from 'vitest';
import {
  poolToSearchParams,
  parsePoolKeyFromSearchParams,
  getPoolListKey,
} from './poolKey';

const pool = {
  name: '올림픽수영장',
  address: '서울시 송파구',
  lat: 37.5215,
  lng: 127.1213,
};

describe('getPoolListKey', () => {
  it('name|address|lat|lng 형식의 키를 만든다', () => {
    expect(getPoolListKey(pool)).toBe('올림픽수영장|서울시 송파구|37.5215|127.1213');
  });

  it('좌표가 다르면 다른 키를 만든다', () => {
    expect(getPoolListKey(pool)).not.toBe(
      getPoolListKey({ ...pool, lat: 37.5216 }),
    );
  });
});

describe('poolToSearchParams / parsePoolKeyFromSearchParams', () => {
  it('직렬화 후 다시 파싱하면 원래 값으로 복원된다 (round-trip)', () => {
    const query = poolToSearchParams(pool);
    const parsed = parsePoolKeyFromSearchParams(new URLSearchParams(query));
    expect(parsed).toEqual(pool);
  });

  it('이름이나 주소가 빠지면 null을 반환한다', () => {
    const params = new URLSearchParams({ name: '풀', lat: '1', lng: '2' });
    expect(parsePoolKeyFromSearchParams(params)).toBeNull();
  });

  it('좌표가 숫자가 아니면 null을 반환한다', () => {
    const params = new URLSearchParams({
      name: '풀',
      address: '주소',
      lat: 'abc',
      lng: '2',
    });
    expect(parsePoolKeyFromSearchParams(params)).toBeNull();
  });
});
