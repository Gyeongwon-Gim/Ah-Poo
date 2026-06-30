import type { Pool } from '../types/pool';

const EARTH_RADIUS_KM = 6371;

export interface GeoOrigin {
  lat?: number;
  lng?: number;
}

/** 두 좌표 사이 거리(km), Haversine */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 기본 주변 반경(km) — 첫 화면 마커 필터 */
export const NEARBY_RADIUS_KM = 10;

/** origin이 있으면 pool에 distanceKm를 부여, 없으면 원본 그대로 반환 */
export function enrichWithDistance<T extends Pool>(
  pool: T,
  origin: GeoOrigin | null | undefined,
): T {
  if (!origin?.lat || !origin?.lng) return pool;
  return {
    ...pool,
    distanceKm: getDistanceKm(origin.lat, origin.lng, pool.lat, pool.lng),
  };
}

/** distanceKm 오름차순 정렬 (원본 불변) */
export function sortByDistanceAsc<T extends Pool>(pools: T[]): T[] {
  return [...pools].sort(
    (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
  );
}

export function filterPoolsWithinKm<T extends Pool>(
  pools: T[],
  origin: GeoOrigin | null | undefined,
  radiusKm: number = NEARBY_RADIUS_KM,
): Array<T & { distanceKm: number }> {
  if (!origin?.lat || !origin?.lng) return [];

  return pools
    .map((pool) => ({
      ...pool,
      distanceKm: getDistanceKm(origin.lat!, origin.lng!, pool.lat, pool.lng),
    }))
    .filter((pool) => pool.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
