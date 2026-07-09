import { getPoolOpenState } from '@/utils/poolOperating';
import type { Pool } from '@/types/pool';
import './PoolStatusTag.css';

interface PoolStatusTagProps {
  pool: Pool;
}

export default function PoolStatusTag({ pool }: PoolStatusTagProps) {
  const state = getPoolOpenState(pool);
  if (state === 'unknown') return null; // 운영시간 데이터 없는 곳은 태그 숨김

  const open = state === 'open';
  return (
    <span
      className={`pool-status-tag ${
        open ? 'pool-status-tag--on' : 'pool-status-tag--off'
      }`}
    >
      <span className="pool-status-tag__dot" aria-hidden />
      <span className="pool-status-tag__label">
        {open ? '운영중' : '운영종료'}
      </span>
    </span>
  );
}
