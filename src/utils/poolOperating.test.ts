import { describe, it, expect } from 'vitest';
import { getPoolOpenState, isPoolOperating } from './poolOperating';
import type { Pool } from '@/types/pool';

const basePool: Pool = {
  name: '테스트수영장',
  roadAddress: '서울 강남구 테헤란로 1',
  lat: 0,
  lng: 0,
  fee: '',
  official_url: '',
  url2: '',
  phone: '',
  is50m: 0,
};

// 2026-07-20은 월요일
const monday9am = new Date(2026, 6, 20, 9, 0);
const mondayMidnight = new Date(2026, 6, 20, 23, 30);
// 2026-07-19는 일요일
const sunday9am = new Date(2026, 6, 19, 9, 0);

describe('getPoolOpenState', () => {
  it('운영시간 데이터가 없으면 unknown', () => {
    expect(getPoolOpenState(basePool, monday9am)).toBe('unknown');
  });

  it('빈 배열이면 unknown', () => {
    const pool: Pool = { ...basePool, operatingHours: [] };
    expect(getPoolOpenState(pool, monday9am)).toBe('unknown');
  });

  it('개장 시간대면 open', () => {
    const pool: Pool = {
      ...basePool,
      operatingHours: [
        { dayOfWeek: 1, openTime: '06:00', closeTime: '21:00', closed: false },
      ],
    };
    expect(getPoolOpenState(pool, monday9am)).toBe('open');
  });

  it('마감 시간 이후면 closed', () => {
    const pool: Pool = {
      ...basePool,
      operatingHours: [
        { dayOfWeek: 1, openTime: '06:00', closeTime: '21:00', closed: false },
      ],
    };
    expect(getPoolOpenState(pool, mondayMidnight)).toBe('closed');
  });

  it('해당 요일이 closed로 표시되면 closed', () => {
    const pool: Pool = {
      ...basePool,
      operatingHours: [
        { dayOfWeek: 0, openTime: null, closeTime: null, closed: true },
      ],
    };
    expect(getPoolOpenState(pool, sunday9am)).toBe('closed');
  });

  it('오늘 요일 데이터가 없으면 closed', () => {
    const pool: Pool = {
      ...basePool,
      operatingHours: [
        { dayOfWeek: 1, openTime: '06:00', closeTime: '21:00', closed: false },
      ],
    };
    expect(getPoolOpenState(pool, sunday9am)).toBe('closed');
  });
});

describe('isPoolOperating', () => {
  it('open 상태일 때만 true', () => {
    const pool: Pool = {
      ...basePool,
      operatingHours: [
        { dayOfWeek: 1, openTime: '06:00', closeTime: '21:00', closed: false },
      ],
    };
    expect(isPoolOperating(pool, monday9am)).toBe(true);
    expect(isPoolOperating(pool, mondayMidnight)).toBe(false);
    expect(isPoolOperating(basePool, monday9am)).toBe(false);
  });
});
