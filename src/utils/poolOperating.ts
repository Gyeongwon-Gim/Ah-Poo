import type { Pool } from '@/types/pool';

export type PoolOpenState = 'open' | 'closed' | 'unknown';

function parseMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const [, hours, minutes] = match;
  return Number(hours) * 60 + Number(minutes);
}

/**
 * 수영장의 현재 운영 상태.
 * `pool.operatingHours`(요일별 개장/마감 시간)가 있는 곳만 open/closed를 판정하고,
 * 데이터가 없는 수영장은 unknown.
 */
export function getPoolOpenState(pool: Pool, now: Date = new Date()): PoolOpenState {
  const hours = pool.operatingHours;
  if (!hours?.length) return 'unknown';

  const today = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || today.closed || !today.openTime || !today.closeTime) {
    return 'closed';
  }

  const open = parseMinutes(today.openTime);
  const close = parseMinutes(today.closeTime);
  if (open === null || close === null) return 'closed';

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= open && nowMinutes < close ? 'open' : 'closed';
}

/** 마커 글로우용: 현재 운영중일 때만 true */
export function isPoolOperating(pool: Pool, now: Date = new Date()): boolean {
  return getPoolOpenState(pool, now) === 'open';
}
