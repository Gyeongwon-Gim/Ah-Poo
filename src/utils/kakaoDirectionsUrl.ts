import type { Pool } from '../types/pool';

/** 카카오맵 길찾기/지도 링크 URL */
export function buildKakaoDirectionsUrl(
  pool: Pick<Pool, 'name' | 'lat' | 'lng'>,
): string {
  return `https://map.kakao.com/link/map/${pool.name},${pool.lat},${pool.lng}`;
}
