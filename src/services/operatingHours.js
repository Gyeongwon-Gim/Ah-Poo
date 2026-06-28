import { DEFAULT_MOCK_WEEKLY } from '../data/mockOperatingHours';

/**
 * 수영장 주간 운영시간을 반환합니다.
 * TODO: Supabase operating_hours 조회로 교체
 *
 * @param {object} _pool
 * @returns {import('../utils/operatingHours').WeeklyHours}
 */
export function getPoolOperatingHours(_pool) {
  return DEFAULT_MOCK_WEEKLY;
}
