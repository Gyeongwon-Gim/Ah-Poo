import type { Pool } from '../types/pool';

export type PoolKey = Pick<Pool, 'name' | 'roadAddress' | 'lat' | 'lng'>;

export function poolToSearchParams(pool: PoolKey): string {
  const params = new URLSearchParams({
    name: pool.name,
    roadAddress: pool.roadAddress,
    lat: String(pool.lat),
    lng: String(pool.lng),
  });
  return params.toString();
}

export function parsePoolKeyFromSearchParams(
  searchParams: URLSearchParams,
): PoolKey | null {
  const name = searchParams.get('name');
  const roadAddress = searchParams.get('roadAddress');
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!name || !roadAddress || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { name, roadAddress, lat, lng };
}

export function getPoolListKey(pool: PoolKey): string {
  return `${pool.name}|${pool.roadAddress}|${pool.lat}|${pool.lng}`;
}
