import { isFlagOn } from '@/services/pools';
import type { Pool } from '@/types/pool';
import { Tag } from '@/components';
import './PoolScheduleTags.css';

interface PoolScheduleTagsProps {
  pool: Pool;
}

const PoolScheduleTags = ({ pool }: PoolScheduleTagsProps) => {
  if (!isFlagOn(pool.is50m)) return null;

  return (
    <div className="pool-schedule-tags">
      <Tag variant="highlight">50m</Tag>
    </div>
  );
};

export default PoolScheduleTags;
