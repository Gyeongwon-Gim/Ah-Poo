import Tag from '@/components/Tag/Tag';
import { getPoolOpenState } from '@/utils/poolOperating';
import type { Pool } from '@/types/pool';

interface PoolStatusTagProps {
  pool: Pool;
}

const PoolStatusTag = ({ pool }: PoolStatusTagProps) => {
  const state = getPoolOpenState(pool);
  if (state === 'unknown') return null; // 운영시간 데이터 없는 곳은 태그 숨김

  const open = state === 'open';
  return (
    <Tag variant="status" active={open} dot>
      {open ? '운영중' : '운영종료'}
    </Tag>
  );
};

export default PoolStatusTag;
