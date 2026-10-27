import { describe, it, expect } from 'vitest';
import type { SwimLog, SwimLogDraft } from '@/types/swimLog';
import {
  buildMonthGrid,
  buildStrokeColumns,
  compareSwimLogDesc,
  computeStrokePercentages,
  daysInMonth,
  emptyStrokeDistances,
  formatDistanceMeters,
  formatDurationMinutes,
  formatSwimDate,
  groupLogsByDate,
  lapsToMeters,
  metersToLaps,
  monthRange,
  parseIsoDate,
  readStrokeDistances,
  sumStrokeDistances,
  summarizeSwimLogs,
  todayIsoDate,
  validateSwimLogDraft,
} from '../swimLog';

const makeLog = (over: Partial<SwimLog> = {}): SwimLog => ({
  id: 'log-1',
  user_id: 'user-1',
  pool_id: null,
  pool_name: '올림픽수영장',
  swam_on: '2026-08-27',
  duration_min: 45,
  freestyle_m: 600,
  backstroke_m: 300,
  breaststroke_m: 300,
  butterfly_m: 0,
  total_distance_m: 1200,
  memo: null,
  created_at: '2026-08-27T10:00:00.000Z',
  updated_at: '2026-08-27T10:00:00.000Z',
  ...over,
});

const makeDraft = (over: Partial<SwimLogDraft> = {}): SwimLogDraft => ({
  poolId: null,
  poolName: '올림픽수영장',
  swamOn: '2026-08-27',
  durationMin: 45,
  distances: { ...emptyStrokeDistances(), freestyle: 600 },
  memo: '',
  ...over,
});

const NOW = new Date(2026, 7, 27); // 2026-08-27 로컬

describe('lapsToMeters', () => {
  it('편도는 레인 길이를 그대로 곱한다', () => {
    expect(lapsToMeters(24, 25, 'oneWay')).toBe(600);
    expect(lapsToMeters(12, 50, 'oneWay')).toBe(600);
  });

  it('왕복은 레인을 두 번 지나므로 두 배가 된다', () => {
    expect(lapsToMeters(12, 25, 'roundTrip')).toBe(600);
    expect(lapsToMeters(12, 50, 'roundTrip')).toBe(1200);
  });

  it('0과 음수, NaN은 0으로 처리한다', () => {
    expect(lapsToMeters(0, 25, 'oneWay')).toBe(0);
    expect(lapsToMeters(-5, 25, 'oneWay')).toBe(0);
    expect(lapsToMeters(Number.NaN, 25, 'oneWay')).toBe(0);
  });

  it('소수점 바퀴는 내림해서 계산한다', () => {
    expect(lapsToMeters(12.9, 25, 'oneWay')).toBe(300);
  });
});

describe('metersToLaps', () => {
  it('lapsToMeters와 왕복 항등이 성립한다', () => {
    expect(metersToLaps(lapsToMeters(12, 25, 'roundTrip'), 25, 'roundTrip')).toBe(12);
    expect(metersToLaps(lapsToMeters(24, 25, 'oneWay'), 25, 'oneWay')).toBe(24);
    expect(metersToLaps(lapsToMeters(7, 50, 'roundTrip'), 50, 'roundTrip')).toBe(7);
  });

  it('0m는 0바퀴다', () => {
    expect(metersToLaps(0, 25, 'oneWay')).toBe(0);
  });

  it('나누어떨어지지 않으면 null을 반환한다 (반올림해서 거리를 바꾸지 않는다)', () => {
    expect(metersToLaps(725, 25, 'roundTrip')).toBeNull();
    expect(metersToLaps(30, 25, 'oneWay')).toBeNull();
  });

  it('레인 길이나 세는 방식을 바꾸면 같은 거리도 환산 가능 여부가 달라진다', () => {
    expect(metersToLaps(600, 25, 'roundTrip')).toBe(12);
    expect(metersToLaps(600, 50, 'roundTrip')).toBe(6);
    expect(metersToLaps(550, 50, 'roundTrip')).toBeNull();
  });
});

describe('sumStrokeDistances / buildStrokeColumns / readStrokeDistances', () => {
  it('입력이 없으면 합계는 0이다', () => {
    expect(sumStrokeDistances(emptyStrokeDistances())).toBe(0);
  });

  it('네 영법을 모두 더한다', () => {
    expect(
      sumStrokeDistances({
        freestyle: 600,
        backstroke: 300,
        breaststroke: 300,
        butterfly: 100,
      }),
    ).toBe(1300);
  });

  it('컬럼 평탄화 후 다시 읽으면 원래 값으로 복원된다 (round-trip)', () => {
    const distances = {
      freestyle: 600,
      backstroke: 300,
      breaststroke: 0,
      butterfly: 100,
    };
    expect(readStrokeDistances(buildStrokeColumns(distances))).toEqual(distances);
  });

  it('컬럼이 비어 있으면 0으로 채운다', () => {
    expect(readStrokeDistances({ freestyle_m: 400 })).toEqual({
      freestyle: 400,
      backstroke: 0,
      breaststroke: 0,
      butterfly: 0,
    });
  });
});

describe('computeStrokePercentages', () => {
  it('합이 0이면 0으로 나누지 않고 전부 0을 반환한다', () => {
    expect(computeStrokePercentages(emptyStrokeDistances())).toEqual({
      freestyle: 0,
      backstroke: 0,
      breaststroke: 0,
      butterfly: 0,
    });
  });

  it('한 영법만 있으면 100%가 된다', () => {
    const result = computeStrokePercentages({
      ...emptyStrokeDistances(),
      freestyle: 800,
    });
    expect(result.freestyle).toBe(100);
  });

  it('나누어떨어지지 않아도 합이 정확히 100이 된다', () => {
    const result = computeStrokePercentages({
      freestyle: 100,
      backstroke: 100,
      breaststroke: 100,
      butterfly: 0,
    });
    const total =
      result.freestyle + result.backstroke + result.breaststroke + result.butterfly;
    expect(total).toBe(100);
  });
});

describe('daysInMonth / monthRange', () => {
  it('월별 일수를 정확히 센다', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29); // 윤년
  });

  it('조회 범위는 그 달의 1일부터 말일까지다', () => {
    expect(monthRange(2026, 8)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(monthRange(2026, 2)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthRange(2028, 2)).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthRange(2026, 12)).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});

describe('buildMonthGrid', () => {
  it('셀 개수는 항상 7의 배수다', () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(buildMonthGrid(2026, month).length % 7).toBe(0);
    }
  });

  it('1일이 목요일인 달은 앞에 패딩 셀 4개가 붙는다', () => {
    const grid = buildMonthGrid(2026, 1); // 2026-01-01은 목요일
    expect(grid.slice(0, 4).every((cell) => !cell.inMonth)).toBe(true);
    expect(grid[4]).toEqual({ date: '2026-01-01', day: 1, inMonth: true });
  });

  it('1일이 일요일이면 패딩 없이 바로 시작한다', () => {
    const grid = buildMonthGrid(2026, 2); // 2026-02-01은 일요일
    expect(grid[0]).toEqual({ date: '2026-02-01', day: 1, inMonth: true });
  });

  it('이번 달 셀 수는 그 달의 일수와 같다', () => {
    const grid = buildMonthGrid(2028, 2);
    expect(grid.filter((cell) => cell.inMonth).length).toBe(29);
  });

  it('앞 패딩 셀은 이전 달의 실제 날짜를 가리킨다', () => {
    const grid = buildMonthGrid(2026, 1);
    expect(grid[0]?.date).toBe('2025-12-28');
  });

  it('앞 패딩과 일수가 딱 7의 배수면 뒤 패딩을 붙이지 않는다', () => {
    const grid = buildMonthGrid(2026, 1); // 앞 패딩 4 + 31일 = 35
    expect(grid).toHaveLength(35);
    expect(grid[grid.length - 1]).toEqual({
      date: '2026-01-31',
      day: 31,
      inMonth: true,
    });
  });

  it('12월 그리드의 뒤쪽 패딩은 다음 해로 넘어간다', () => {
    const grid = buildMonthGrid(2026, 12);
    const last = grid[grid.length - 1];
    expect(last?.inMonth).toBe(false);
    expect(last?.date.startsWith('2027-01')).toBe(true);
  });
});

describe('parseIsoDate / todayIsoDate', () => {
  it('UTC가 아니라 로컬 자정으로 파싱한다', () => {
    const date = parseIsoDate('2026-08-27');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(27);
  });

  it('존재하지 않는 날짜나 잘못된 형식은 null이다', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-08')).toBeNull();
    expect(parseIsoDate('abc')).toBeNull();
  });

  it('한 자리 월·일도 zero-pad 한다', () => {
    expect(todayIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('로컬 자정 직전과 직후가 서로 다른 날짜다', () => {
    expect(todayIsoDate(new Date(2026, 7, 27, 23, 59, 59))).toBe('2026-08-27');
    expect(todayIsoDate(new Date(2026, 7, 28, 0, 0, 0))).toBe('2026-08-28');
  });
});

describe('groupLogsByDate / compareSwimLogDesc / summarizeSwimLogs', () => {
  it('같은 날 기록을 한 버킷에 모은다', () => {
    const grouped = groupLogsByDate([
      makeLog({ id: 'a', swam_on: '2026-08-27' }),
      makeLog({ id: 'b', swam_on: '2026-08-27' }),
      makeLog({ id: 'c', swam_on: '2026-08-25' }),
    ]);
    expect(grouped.get('2026-08-27')).toHaveLength(2);
    expect(grouped.get('2026-08-25')).toHaveLength(1);
    expect(grouped.get('2026-08-01')).toBeUndefined();
  });

  it('빈 배열은 빈 Map이다', () => {
    expect(groupLogsByDate([]).size).toBe(0);
  });

  it('날짜 내림차순, 같은 날이면 생성 시각 내림차순으로 정렬한다', () => {
    const older = makeLog({ id: 'old', swam_on: '2026-08-25' });
    const newer = makeLog({ id: 'new', swam_on: '2026-08-27' });
    expect(compareSwimLogDesc(newer, older)).toBeLessThan(0);

    const sameDayEarly = makeLog({ created_at: '2026-08-27T09:00:00.000Z' });
    const sameDayLate = makeLog({ created_at: '2026-08-27T11:00:00.000Z' });
    expect(compareSwimLogDesc(sameDayLate, sameDayEarly)).toBeLessThan(0);
  });

  it('빈 목록의 요약은 모든 값이 0이다', () => {
    expect(summarizeSwimLogs([])).toEqual({
      logCount: 0,
      totalDistanceM: 0,
      totalDurationMin: 0,
      strokeTotals: emptyStrokeDistances(),
    });
  });

  it('영법별로 누적하고 총 거리는 영법 합계와 일치한다', () => {
    const stats = summarizeSwimLogs([
      makeLog({ freestyle_m: 600, backstroke_m: 300, breaststroke_m: 300 }),
      makeLog({ freestyle_m: 400, backstroke_m: 0, breaststroke_m: 0, butterfly_m: 100 }),
    ]);
    expect(stats.logCount).toBe(2);
    expect(stats.strokeTotals.freestyle).toBe(1000);
    expect(stats.strokeTotals.butterfly).toBe(100);
    expect(stats.totalDistanceM).toBe(1700);
    expect(stats.totalDistanceM).toBe(
      stats.strokeTotals.freestyle +
        stats.strokeTotals.backstroke +
        stats.strokeTotals.breaststroke +
        stats.strokeTotals.butterfly,
    );
  });

  it('시간이 없는 기록은 총 시간에서 무시한다', () => {
    const stats = summarizeSwimLogs([
      makeLog({ duration_min: 45 }),
      makeLog({ duration_min: null }),
    ]);
    expect(stats.totalDurationMin).toBe(45);
  });
});

describe('formatDistanceMeters', () => {
  it('1km 미만은 m로, 이상은 km로 쓴다', () => {
    expect(formatDistanceMeters(0)).toBe('0m');
    expect(formatDistanceMeters(800)).toBe('800m');
    expect(formatDistanceMeters(1000)).toBe('1km');
    expect(formatDistanceMeters(1200)).toBe('1.2km');
    expect(formatDistanceMeters(1250)).toBe('1.25km');
    expect(formatDistanceMeters(9600)).toBe('9.6km');
  });
});

describe('formatDurationMinutes', () => {
  it('시간과 분으로 나눠 쓴다', () => {
    expect(formatDurationMinutes(null)).toBe('');
    expect(formatDurationMinutes(0)).toBe('');
    expect(formatDurationMinutes(45)).toBe('45분');
    expect(formatDurationMinutes(60)).toBe('1시간');
    expect(formatDurationMinutes(90)).toBe('1시간 30분');
    expect(formatDurationMinutes(1440)).toBe('24시간');
  });
});

describe('formatSwimDate', () => {
  it('요일을 붙여 표기한다', () => {
    expect(formatSwimDate('2026-08-27')).toBe('8월 27일 (목)');
    expect(formatSwimDate('2026-01-01')).toBe('1월 1일 (목)');
    expect(formatSwimDate('2026-12-31')).toBe('12월 31일 (목)');
  });

  it('파싱할 수 없으면 원본을 그대로 돌려준다', () => {
    expect(formatSwimDate('not-a-date')).toBe('not-a-date');
  });
});

describe('validateSwimLogDraft', () => {
  it('정상 입력이면 null을 반환한다', () => {
    expect(validateSwimLogDraft(makeDraft(), NOW)).toBeNull();
  });

  it('거리를 하나도 입력하지 않으면 막는다', () => {
    const error = validateSwimLogDraft(
      makeDraft({ distances: emptyStrokeDistances() }),
      NOW,
    );
    expect(error).toBe('거리를 하나 이상 입력해주세요.');
  });

  it('수영장 이름이 공백뿐이거나 너무 길면 막는다', () => {
    expect(validateSwimLogDraft(makeDraft({ poolName: '   ' }), NOW)).not.toBeNull();
    expect(
      validateSwimLogDraft(makeDraft({ poolName: '가'.repeat(101) }), NOW),
    ).not.toBeNull();
  });

  it('미래 날짜는 막고 오늘은 허용한다', () => {
    expect(validateSwimLogDraft(makeDraft({ swamOn: '2026-08-28' }), NOW)).toBe(
      '아직 오지 않은 날짜는 기록할 수 없습니다.',
    );
    expect(validateSwimLogDraft(makeDraft({ swamOn: '2026-08-27' }), NOW)).toBeNull();
  });

  it('운동 시간이 범위를 벗어나면 막는다', () => {
    expect(validateSwimLogDraft(makeDraft({ durationMin: 0 }), NOW)).not.toBeNull();
    expect(validateSwimLogDraft(makeDraft({ durationMin: 1441 }), NOW)).not.toBeNull();
    expect(validateSwimLogDraft(makeDraft({ durationMin: 1440 }), NOW)).toBeNull();
    expect(validateSwimLogDraft(makeDraft({ durationMin: null }), NOW)).toBeNull();
  });

  it('영법별 거리 상한과 메모 길이를 검사한다', () => {
    expect(
      validateSwimLogDraft(
        makeDraft({ distances: { ...emptyStrokeDistances(), freestyle: 50001 } }),
        NOW,
      ),
    ).not.toBeNull();
    expect(
      validateSwimLogDraft(makeDraft({ memo: '가'.repeat(501) }), NOW),
    ).not.toBeNull();
  });
});
