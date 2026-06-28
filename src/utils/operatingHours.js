/** JS Date.getDay() 기준: 0=일 ~ 6=토 */
export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** @typedef {{ type: 'open', open: string, close: string }} OpenDaySchedule */
/** @typedef {{ type: 'closed', label: string }} ClosedDaySchedule */
/** @typedef {OpenDaySchedule | ClosedDaySchedule} DaySchedule */
/** @typedef {Record<number, DaySchedule>} WeeklyHours */

/**
 * @param {string} time - "HH:mm"
 * @returns {number}
 */
export function parseTimeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * @param {WeeklyHours | null | undefined} weekly
 * @param {number} dayIndex - 0~6
 * @returns {DaySchedule | null}
 */
export function getDaySchedule(weekly, dayIndex) {
  if (!weekly) return null;
  return weekly[dayIndex] ?? null;
}

/**
 * @param {string} open
 * @param {string} close
 * @returns {string}
 */
export function formatHoursRange(open, close) {
  return `${open} - ${close}`;
}

/**
 * @param {Date} date
 * @returns {number}
 */
export function getMinutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * @param {WeeklyHours} weekly
 * @param {Date} now
 * @returns {{ dayLabel: string, open: string, isTomorrow: boolean } | null}
 */
export function findNextOpening(weekly, now) {
  const today = now.getDay();
  const nowMinutes = getMinutesOfDay(now);

  const todaySchedule = getDaySchedule(weekly, today);
  if (todaySchedule?.type === 'open') {
    const openMinutes = parseTimeToMinutes(todaySchedule.open);
    if (nowMinutes < openMinutes) {
      return {
        dayLabel: DAY_LABELS[today],
        open: todaySchedule.open,
        isTomorrow: false,
      };
    }
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const dayIndex = (today + offset) % 7;
    const schedule = getDaySchedule(weekly, dayIndex);
    if (schedule?.type === 'open') {
      return {
        dayLabel: DAY_LABELS[dayIndex],
        open: schedule.open,
        isTomorrow: offset === 1,
      };
    }
  }

  return null;
}

/**
 * @param {WeeklyHours} weekly
 * @param {Date} [now]
 * @returns {{ isOpen: boolean, statusText: string, detailText: string }}
 */
export function getOperatingStatus(weekly, now = new Date()) {
  const today = now.getDay();
  const nowMinutes = getMinutesOfDay(now);
  const schedule = getDaySchedule(weekly, today);

  if (schedule?.type === 'open') {
    const openMinutes = parseTimeToMinutes(schedule.open);
    const closeMinutes = parseTimeToMinutes(schedule.close);

    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
      return {
        isOpen: true,
        statusText: '영업 중',
        detailText: `${schedule.close}에 영업 종료`,
      };
    }

    if (nowMinutes < openMinutes) {
      return {
        isOpen: false,
        statusText: '영업 전',
        detailText: `${schedule.open}에 영업 시작`,
      };
    }
  }

  const next = findNextOpening(weekly, now);
  const detailText = next
    ? next.isTomorrow
      ? `내일 ${next.open}에 영업 시작`
      : `${next.dayLabel} ${next.open}에 영업 시작`
    : '';

  return {
    isOpen: false,
    statusText: '영업 종료',
    detailText,
  };
}

/**
 * @param {DaySchedule | null} schedule
 * @returns {string}
 */
export function formatDayHoursText(schedule) {
  if (!schedule) return '정보 없음';
  if (schedule.type === 'closed') {
    return `정기휴무 (${schedule.label})`;
  }
  return formatHoursRange(schedule.open, schedule.close);
}

/**
 * @param {WeeklyHours} weekly
 * @param {Date} [now]
 * @returns {{ dayLabel: string, hoursText: string, isToday: boolean }[]}
 */
export function getWeekRowsOrderedFromToday(weekly, now = new Date()) {
  const today = now.getDay();
  const rows = [];

  for (let i = 0; i < 7; i += 1) {
    const dayIndex = (today + i) % 7;
    rows.push({
      dayLabel: DAY_LABELS[dayIndex],
      hoursText: formatDayHoursText(getDaySchedule(weekly, dayIndex)),
      isToday: i === 0,
    });
  }

  return rows;
}
