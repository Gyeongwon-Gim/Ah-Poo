import { describe, it, expect } from 'vitest';
import { getDistanceKm, filterPoolsWithinKm, NEARBY_RADIUS_KM } from './geo';
import type { Pool } from '../types/pool';

describe('getDistanceKm', () => {
  it('동일한 좌표의 거리는 0이다', () => {
    expect(getDistanceKm(37.5, 127.0, 37.5, 127.0)).toBe(0);
  });

  it('알려진 두 지점 사이 거리를 근사적으로 계산한다 (서울시청 ~ 강남역 약 8km)', () => {
    const seoulCityHall = { lat: 37.5663, lng: 126.9779 };
    const gangnam = { lat: 37.4979, lng: 127.0276 };
    const d = getDistanceKm(
      seoulCityHall.lat,
      seoulCityHall.lng,
      gangnam.lat,
      gangnam.lng,
    );
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(9);
  });

  it('거리는 방향과 무관하게 대칭이다', () => {
    const a = getDistanceKm(37.5, 127.0, 35.1, 129.0);
    const b = getDistanceKm(35.1, 129.0, 37.5, 127.0);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('filterPoolsWithinKm', () => {
  const origin = { lat: 37.5, lng: 127.0 };
  const near = { name: '가까운풀', lat: 37.51, lng: 127.01 } as Pool;
  const far = { name: '먼풀', lat: 38.5, lng: 128.0 } as Pool;

  it('origin이 없으면 빈 배열을 반환한다', () => {
    const pools = [near, far];
    expect(filterPoolsWithinKm(pools, null)).toEqual([]);
    expect(filterPoolsWithinKm(pools, { lat: 0, lng: undefined })).toEqual([]);
  });

  it('반경 내 수영장만 남긴다', () => {
    const result = filterPoolsWithinKm([near, far], origin, 5);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('가까운풀');
  });

  it('각 결과에 distanceKm를 부여하고 거리 오름차순으로 정렬한다', () => {
    const mid = { name: '중간풀', lat: 37.53, lng: 127.03 } as Pool;
    const result = filterPoolsWithinKm([mid, near, far], origin, 500);
    expect(result.map((p) => p.name)).toEqual(['가까운풀', '중간풀', '먼풀']);
    result.forEach((p) => expect(typeof p.distanceKm).toBe('number'));
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i]!.distanceKm).toBeGreaterThanOrEqual(result[i - 1]!.distanceKm);
    }
  });

  it('radius 인자를 생략하면 기본 반경(NEARBY_RADIUS_KM)을 사용한다', () => {
    const result = filterPoolsWithinKm([near, far], origin);
    expect(result).toHaveLength(1);
    expect(NEARBY_RADIUS_KM).toBe(10);
  });
});
