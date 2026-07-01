import { scorePool } from './poolSearch';
import type { Pool } from '../types/pool';

export interface MapFitTarget {
  lat: number;
  lng: number;
  level: number;
}

/** 검색 fit 시 최대 zoom-out (카카오 level, 숫자 클수록 축소) */
export const SEARCH_FIT_MAX_LEVEL = 9;

const EARTH_RADIUS_KM = 6371;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function weightedCentroid(
  pools: Pick<Pool, 'lat' | 'lng'>[],
  weights: number[],
): { lat: number; lng: number } {
  let totalWeight = 0;
  let lat = 0;
  let lng = 0;

  for (let i = 0; i < pools.length; i += 1) {
    const pool = pools[i];
    if (!pool) continue;
    const w = Math.max(weights[i] ?? 1, 0.001);
    totalWeight += w;
    lat += pool.lat * w;
    lng += pool.lng * w;
  }

  if (totalWeight === 0) {
    const first = pools[0];
    return first ? { lat: first.lat, lng: first.lng } : { lat: 0, lng: 0 };
  }

  return { lat: lat / totalWeight, lng: lng / totalWeight };
}

function percentileRadiusKm(
  pools: Pick<Pool, 'lat' | 'lng'>[],
  center: { lat: number; lng: number },
  percentile = 0.85,
): number {
  if (pools.length <= 1) return 0.5;

  const distances = pools
    .map((pool) => haversineKm(center.lat, center.lng, pool.lat, pool.lng))
    .sort((a, b) => a - b);

  const index = Math.min(
    distances.length - 1,
    Math.max(0, Math.ceil(distances.length * percentile) - 1),
  );
  return distances[index] ?? 0.5;
}

export function radiusKmToKakaoLevel(radiusKm: number): number {
  if (radiusKm <= 0.3) return 5;
  if (radiusKm <= 0.8) return 6;
  if (radiusKm <= 2) return 7;
  if (radiusKm <= 5) return 8;
  if (radiusKm <= 12) return 9;
  if (radiusKm <= 25) return 10;
  return 11;
}

/** 검색 결과용 centroid + percentile radius fit */
export function computeSearchMapFit(
  pools: Pick<Pool, 'lat' | 'lng' | 'name' | 'roadAddress' | 'fee'>[],
  searchTerm?: string,
): MapFitTarget | null {
  if (pools.length === 0) return null;

  if (pools.length === 1) {
    const only = pools[0]!;
    return { lat: only.lat, lng: only.lng, level: 5 };
  }

  const weights = searchTerm?.trim()
    ? pools.map((pool) => Math.max(scorePool(pool, searchTerm), 1))
    : pools.map(() => 1);

  const center = weightedCentroid(pools, weights);
  const radiusKm = percentileRadiusKm(pools, center, 0.85);
  const level = Math.min(
    radiusKmToKakaoLevel(radiusKm),
    SEARCH_FIT_MAX_LEVEL,
  );

  return { ...center, level };
}
