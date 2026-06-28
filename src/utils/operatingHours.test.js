import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  getOperatingStatus,
  getWeekRowsOrderedFromToday,
  formatHoursRange,
  findNextOpening,
} from './operatingHours';
import { DEFAULT_MOCK_WEEKLY } from '../data/mockOperatingHours';

function at(day, hour, minute = 0) {
  // 2026-06-27 is Saturday (6)
  const base = new Date(2026, 5, 27, hour, minute);
  const offset = day - 6;
  base.setDate(base.getDate() + offset);
  return base;
}

describe('parseTimeToMinutes', () => {
  it('HH:mm을 분으로 변환한다', () => {
    expect(parseTimeToMinutes('06:00')).toBe(360);
    expect(parseTimeToMinutes('16:30')).toBe(990);
    expect(parseTimeToMinutes('21:30')).toBe(1290);
  });
});

describe('formatHoursRange', () => {
  it('시간 범위를 포맷한다', () => {
    expect(formatHoursRange('08:00', '16:30')).toBe('08:00 - 16:30');
  });
});

describe('getOperatingStatus', () => {
  it('영업 중이면 종료 시각을 안내한다', () => {
    const now = at(6, 10, 0); // 토요일 10:00
    const status = getOperatingStatus(DEFAULT_MOCK_WEEKLY, now);
    expect(status.isOpen).toBe(true);
    expect(status.statusText).toBe('영업 중');
    expect(status.detailText).toBe('16:30에 영업 종료');
  });

  it('개장 전이면 시작 시각을 안내한다', () => {
    const now = at(1, 5, 0); // 월요일 05:00
    const status = getOperatingStatus(DEFAULT_MOCK_WEEKLY, now);
    expect(status.isOpen).toBe(false);
    expect(status.statusText).toBe('영업 전');
    expect(status.detailText).toBe('06:00에 영업 시작');
  });

  it('영업 종료 후 다음 영업일을 안내한다 (휴무일 건너뜀)', () => {
    const now = at(6, 17, 0); // 토요일 17:00 → 일요일 휴무 → 월요일 개장
    const status = getOperatingStatus(DEFAULT_MOCK_WEEKLY, now);
    expect(status.isOpen).toBe(false);
    expect(status.statusText).toBe('영업 종료');
    expect(status.detailText).toBe('월 06:00에 영업 시작');
  });

  it('영업 종료 후 내일이 영업일이면 내일로 안내한다', () => {
    const now = at(5, 22, 0); // 금요일 22:00 → 토요일 개장
    const status = getOperatingStatus(DEFAULT_MOCK_WEEKLY, now);
    expect(status.detailText).toBe('내일 08:00에 영업 시작');
  });

  it('휴무일이면 다음 영업일을 안내한다', () => {
    const now = at(0, 12, 0); // 일요일 12:00
    const status = getOperatingStatus(DEFAULT_MOCK_WEEKLY, now);
    expect(status.isOpen).toBe(false);
    expect(status.statusText).toBe('영업 종료');
    expect(status.detailText).toBe('내일 06:00에 영업 시작');
  });
});

describe('findNextOpening', () => {
  it('금요일 밤에는 토요일 개장을 안내한다', () => {
    const now = at(5, 22, 0); // 금요일 22:00
    const next = findNextOpening(DEFAULT_MOCK_WEEKLY, now);
    expect(next).toEqual({
      dayLabel: '토',
      open: '08:00',
      isTomorrow: true,
    });
  });
});

describe('getWeekRowsOrderedFromToday', () => {
  it('오늘 요일부터 7일을 반환한다', () => {
    const now = at(6, 10, 0); // 토요일
    const rows = getWeekRowsOrderedFromToday(DEFAULT_MOCK_WEEKLY, now);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({
      dayLabel: '토',
      hoursText: '08:00 - 16:30',
      isToday: true,
    });
    expect(rows[1]).toEqual({
      dayLabel: '일',
      hoursText: '정기휴무 (매주 일요일)',
      isToday: false,
    });
    expect(rows[2].dayLabel).toBe('월');
    expect(rows[2].hoursText).toBe('06:00 - 21:30');
  });
});
