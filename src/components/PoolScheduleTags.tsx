import { isFlagOn } from '../services/pools';
import type { Pool } from '../types/pool';
import './PoolScheduleTags.css';

const SCHEDULE_LABELS = [
  { key: 'is50m' as const, label: '50m' },
  { key: 'isWeekday' as const, label: '평일' },
  { key: 'isSaturday' as const, label: '토요일' },
  { key: 'isSunday' as const, label: '일요일' },
  { key: 'isHoliday' as const, label: '공휴일' },
];

interface PoolScheduleTagsProps {
  pool: Pool;
}

export default function PoolScheduleTags({ pool }: PoolScheduleTagsProps) {
  const active = SCHEDULE_LABELS.filter(({ key }) => isFlagOn(pool[key]));

  if (active.length === 0) return null;

  return (
    <div className="pool-schedule-tags">
      {active.map(({ key, label }) => (
        <span
          key={key}
          className={`pool-schedule-tag${key === 'is50m' ? ' pool-schedule-tag--50m' : ''}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
