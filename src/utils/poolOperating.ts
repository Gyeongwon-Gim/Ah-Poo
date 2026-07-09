import type { Pool } from '@/types/pool';

export type PoolOpenState = 'open' | 'closed' | 'unknown';

// 영천 2곳(종합스포츠센터·국민체육센터) 공통 스케줄:
// 평일 06:00~21:00, 토요일 06:00~19:00, 일요일 휴관.
// 공휴일은 미반영(요일 기준). DB에 운영시간이 생기면 이 로직을 일반화한다.
function yeongcheonState(now: Date): 'open' | 'closed' {
  const day = now.getDay(); // 0=일 … 6=토
  if (day === 0) return 'closed'; // 일요일 휴관
  const minutes = now.getHours() * 60 + now.getMinutes();
  const close = (day === 6 ? 19 : 21) * 60; // 토 19시, 평일 21시
  return minutes >= 6 * 60 && minutes < close ? 'open' : 'closed';
}

/**
 * 수영장의 현재 운영 상태.
 * 운영시간을 아는 영천 2곳만 open/closed를 판정하고, 나머지는 unknown.
 */
export function getPoolOpenState(pool: Pool, now: Date = new Date()): PoolOpenState {
  if (!pool.roadAddress.includes('영천시')) return 'unknown';
  return yeongcheonState(now);
}

/** 마커 글로우용: 현재 운영중일 때만 true */
export function isPoolOperating(pool: Pool, now: Date = new Date()): boolean {
  return getPoolOpenState(pool, now) === 'open';
}
