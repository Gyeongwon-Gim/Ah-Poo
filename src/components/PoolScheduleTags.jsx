import { isFlagOn } from '../services/pools'
import './PoolScheduleTags.css'

const SCHEDULE_LABELS = [
  { key: 'is50m', label: '50m' },
  { key: 'isWeekday', label: '평일' },
  { key: 'isSaturday', label: '토요일' },
  { key: 'isSunday', label: '일요일' },
  { key: 'isHoliday', label: '공휴일' },
]

function PoolScheduleTags({ pool }) {
  const active = SCHEDULE_LABELS.filter(({ key }) => isFlagOn(pool[key]))

  if (active.length === 0) return null

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
  )
}

export default PoolScheduleTags
