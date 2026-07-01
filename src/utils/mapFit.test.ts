import { describe, it, expect } from 'vitest';
import { computeSearchMapFit, radiusKmToKakaoLevel } from './mapFit';
import type { Pool } from '../types/pool';

const basePool = {
  name: '테스트',
  roadAddress: '대구 중구',
  fee: '3000원',
  official_url: '',
  url2: '',
  phone: '',
  is50m: 0,
  isWeekday: 0,
  isSaturday: 0,
  isSunday: 0,
  isHoliday: 0,
} satisfies Omit<Pool, 'lat' | 'lng' | 'id'>;

describe('mapFit', () => {
  it('단일 풀은 level 5로 반환한다', () => {
    const fit = computeSearchMapFit([
      { ...basePool, lat: 35.87, lng: 128.6 },
    ]);
    expect(fit).toEqual({ lat: 35.87, lng: 128.6, level: 5 });
  });

  it('여러 풀은 centroid와 level cap을 적용한다', () => {
    const pools = [
      { ...basePool, lat: 35.87, lng: 128.6 },
      { ...basePool, lat: 35.88, lng: 128.61 },
      { ...basePool, lat: 35.89, lng: 128.62 },
    ];
    const fit = computeSearchMapFit(pools, '대구');
    expect(fit?.level).toBeLessThanOrEqual(9);
    expect(fit?.lat).toBeGreaterThan(35.86);
    expect(fit?.lat).toBeLessThan(35.9);
  });

  it('radiusKmToKakaoLevel은 거리에 따라 level을 올린다', () => {
    expect(radiusKmToKakaoLevel(0.2)).toBeLessThan(radiusKmToKakaoLevel(20));
  });
});
