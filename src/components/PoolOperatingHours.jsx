import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import {
  getOperatingStatus,
  getWeekRowsOrderedFromToday,
} from '../utils/operatingHours';
import './PoolOperatingHours.css';

function PoolOperatingHours({ weeklyHours, now = new Date() }) {
  const [expanded, setExpanded] = useState(false);

  if (!weeklyHours) return null;

  const status = getOperatingStatus(weeklyHours, now);
  const rows = getWeekRowsOrderedFromToday(weeklyHours, now);

  return (
    <section className="pool-hours" aria-label="운영 시간">
      <button
        type="button"
        className="pool-hours__summary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Clock size={16} className="pool-hours__icon" aria-hidden />
        <span
          className={`pool-hours__status${
            status.isOpen ? ' pool-hours__status--open' : ''
          }`}
        >
          {status.statusText}
        </span>
        <span className="pool-hours__detail-group">
          {status.detailText && (
            <span className="pool-hours__detail">{status.detailText}</span>
          )}
          <span
            className={`pool-hours__chevron${
              expanded ? ' pool-hours__chevron--expanded' : ''
            }`}
            aria-hidden
          >
            <ChevronDown size={16} />
          </span>
        </span>
      </button>

      <div
        className={`pool-hours__panel${
          expanded ? ' pool-hours__panel--expanded' : ''
        }`}
      >
        <ul className="pool-hours__list">
          {rows.map(({ dayLabel, hoursText, isToday }) => (
            <li
              key={dayLabel}
              className={`pool-hours__row${
                isToday ? ' pool-hours__row--today' : ''
              }`}
            >
              <span className="pool-hours__day">{dayLabel}</span>
              <span className="pool-hours__time">{hoursText}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default PoolOperatingHours;
