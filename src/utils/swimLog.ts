import {
  SWIM_STROKES,
  STROKE_COLUMNS,
  type LapCountMode,
  type LaneLength,
  type MonthGridCell,
  type StrokeDistances,
  type SwimLog,
  type SwimLogDraft,
  type SwimLogStats,
  type SwimStroke,
} from '@/types/swimLog';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const MAX_POOL_NAME_LENGTH = 100;
const MAX_MEMO_LENGTH = 500;
const MAX_DURATION_MIN = 1440;
const MAX_DISTANCE_PER_STROKE_M = 50000;
const DAYS_PER_WEEK = 7;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 0 이상의 정수로 정규화. NaN·음수·소수점 입력을 방어한다. */
const toSafeCount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
};

export const toIsoDate = (year: number, month: number, day: number): string =>
  `${year}-${pad2(month)}-${pad2(day)}`;

/**
 * 'YYYY-MM-DD'를 로컬 자정으로 파싱한다.
 * new Date('2026-08-27')은 UTC 자정으로 해석돼 음수 오프셋 지역에서 하루 밀리므로
 * 문자열을 직접 쪼개 로컬 Date를 만든다.
 */
export const parseIsoDate = (iso: string): Date | null => {
  const parts = iso.split('-');
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // 2026-02-30 처럼 존재하지 않는 날짜는 Date가 다음 달로 넘겨버린다.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

export const todayIsoDate = (now: Date = new Date()): string =>
  toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

/** 해당 월의 일수. month는 1~12. */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

// ---------------------------------------------------------------------------
// 바퀴 ↔ 미터 환산
// ---------------------------------------------------------------------------

/** 바퀴 1회가 몇 미터인지. 왕복은 레인을 두 번 지난다. */
const metersPerLap = (laneM: LaneLength, mode: LapCountMode): number =>
  mode === 'roundTrip' ? laneM * 2 : laneM;

export const lapsToMeters = (
  laps: number,
  laneM: LaneLength,
  mode: LapCountMode,
): number => toSafeCount(laps) * metersPerLap(laneM, mode);

/**
 * 미터를 바퀴 수로 역산한다.
 *
 * DB에는 미터만 저장하므로, 세는 방식이나 레인 길이를 바꾼 뒤 과거 기록을 수정하면
 * 나누어떨어지지 않을 수 있다(예: 왕복·25m 설정에서 725m).
 * 이때 반올림하면 사용자가 건드리지도 않은 거리가 조용히 바뀌므로 null을 반환하고,
 * 호출부가 그 영법만 미터 직접 입력으로 폴백하게 한다.
 */
export const metersToLaps = (
  meters: number,
  laneM: LaneLength,
  mode: LapCountMode,
): number | null => {
  const safeMeters = toSafeCount(meters);
  if (safeMeters === 0) return 0;

  const perLap = metersPerLap(laneM, mode);
  if (safeMeters % perLap !== 0) return null;
  return safeMeters / perLap;
};

// ---------------------------------------------------------------------------
// 영법별 거리
// ---------------------------------------------------------------------------

export const emptyStrokeDistances = (): StrokeDistances => ({
  freestyle: 0,
  backstroke: 0,
  breaststroke: 0,
  butterfly: 0,
});

export const sumStrokeDistances = (distances: StrokeDistances): number =>
  SWIM_STROKES.reduce((sum, stroke) => sum + toSafeCount(distances[stroke]), 0);

/** StrokeDistances → swim_logs의 4개 컬럼. insert/update payload에 펼쳐 쓴다. */
export const buildStrokeColumns = (
  distances: StrokeDistances,
): Record<string, number> => {
  const columns: Record<string, number> = {};
  for (const stroke of SWIM_STROKES) {
    columns[STROKE_COLUMNS[stroke]] = toSafeCount(distances[stroke]);
  }
  return columns;
};

/** swim_logs 행 → StrokeDistances. 컬럼이 비어 있으면 0으로 채운다. */
export const readStrokeDistances = (
  row: Partial<Record<string, unknown>>,
): StrokeDistances => {
  const distances = emptyStrokeDistances();
  for (const stroke of SWIM_STROKES) {
    const raw = row[STROKE_COLUMNS[stroke]];
    distances[stroke] = typeof raw === 'number' ? toSafeCount(raw) : 0;
  }
  return distances;
};

/**
 * 영법별 비중(%). 스택 바 렌더용.
 * 단순 반올림은 합이 99나 101이 되어 바에 틈이 생기므로,
 * 최대잔여법으로 남는 1%p를 소수부가 큰 영법부터 나눠준다.
 */
export const computeStrokePercentages = (
  distances: StrokeDistances,
): Record<SwimStroke, number> => {
  const total = sumStrokeDistances(distances);
  const result: Record<SwimStroke, number> = {
    freestyle: 0,
    backstroke: 0,
    breaststroke: 0,
    butterfly: 0,
  };
  if (total === 0) return result;

  const exact = SWIM_STROKES.map((stroke) => {
    const share = (toSafeCount(distances[stroke]) / total) * 100;
    return { stroke, floor: Math.floor(share), remainder: share % 1 };
  });

  for (const entry of exact) result[entry.stroke] = entry.floor;

  let leftover = 100 - exact.reduce((sum, entry) => sum + entry.floor, 0);
  const byRemainder = [...exact].sort((a, b) => b.remainder - a.remainder);
  for (const entry of byRemainder) {
    if (leftover <= 0) break;
    result[entry.stroke] += 1;
    leftover -= 1;
  }

  return result;
};

// ---------------------------------------------------------------------------
// 월간 조회 · 캘린더 그리드
// ---------------------------------------------------------------------------

/** 해당 월의 조회 범위. swam_on이 date 컬럼이라 문자열 비교로 충분하다. */
export const monthRange = (
  year: number,
  month: number,
): { from: string; to: string } => ({
  from: toIsoDate(year, month, 1),
  to: toIsoDate(year, month, daysInMonth(year, month)),
});

/**
 * 일요일 시작 7열 캘린더 그리드.
 * 앞뒤를 이웃 달 날짜로 채워 항상 7의 배수 개 셀을 만든다.
 */
export const buildMonthGrid = (
  year: number,
  month: number,
): MonthGridCell[] => {
  const leading = new Date(year, month - 1, 1).getDay();
  const total = daysInMonth(year, month);
  const cells: MonthGridCell[] = [];

  const push = (offsetFromFirst: number) => {
    const date = new Date(year, month - 1, 1 + offsetFromFirst);
    cells.push({
      date: toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      inMonth: offsetFromFirst >= 0 && offsetFromFirst < total,
    });
  };

  for (let i = leading; i > 0; i -= 1) push(-i);
  for (let i = 0; i < total; i += 1) push(i);
  while (cells.length % DAYS_PER_WEEK !== 0) push(cells.length - leading);

  return cells;
};

/** 'YYYY-MM-DD' → 그날의 기록들. 캘린더 셀이 O(1)로 조회한다. */
export const groupLogsByDate = (logs: SwimLog[]): Map<string, SwimLog[]> => {
  const grouped = new Map<string, SwimLog[]>();
  for (const log of logs) {
    const bucket = grouped.get(log.swam_on);
    if (bucket) bucket.push(log);
    else grouped.set(log.swam_on, [log]);
  }
  return grouped;
};

/** 월간 요약 헤더용 집계. 한 달치라 클라이언트에서 계산해도 비용이 없다. */
export const summarizeSwimLogs = (logs: SwimLog[]): SwimLogStats => {
  const strokeTotals = emptyStrokeDistances();
  let totalDistanceM = 0;
  let totalDurationMin = 0;

  for (const log of logs) {
    const distances = readStrokeDistances(log as unknown as Record<string, unknown>);
    for (const stroke of SWIM_STROKES) {
      strokeTotals[stroke] += distances[stroke];
    }
    totalDistanceM += sumStrokeDistances(distances);
    totalDurationMin += toSafeCount(log.duration_min ?? 0);
  }

  return {
    logCount: logs.length,
    totalDistanceM,
    totalDurationMin,
    strokeTotals,
  };
};

/** swam_on 내림차순, 같은 날이면 created_at 내림차순. */
export const compareSwimLogDesc = (a: SwimLog, b: SwimLog): number => {
  if (a.swam_on !== b.swam_on) return a.swam_on < b.swam_on ? 1 : -1;
  if (a.created_at === b.created_at) return 0;
  return a.created_at < b.created_at ? 1 : -1;
};

// ---------------------------------------------------------------------------
// 표시 포맷
// ---------------------------------------------------------------------------

/**
 * 수영 거리 표기. 기존 formatDistance()는 km를 받으므로 그대로 쓸 수 없다.
 * 1km 미만은 m, 이상은 소수점 뒤 불필요한 0을 떼고 km로 쓴다.
 */
export const formatDistanceMeters = (meters: number): string => {
  const safe = toSafeCount(meters);
  if (safe < 1000) return `${safe.toLocaleString('ko-KR')}m`;
  const km = safe / 1000;
  return `${Number(km.toFixed(2))}km`;
};

export const formatDurationMinutes = (minutes: number | null): string => {
  if (minutes == null) return '';
  const safe = toSafeCount(minutes);
  if (safe === 0) return '';
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
};

/** '2026-08-27' → '8월 27일 (목)'. 파싱 실패 시 원본을 그대로 돌려준다. */
export const formatSwimDate = (iso: string): string => {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const weekday = WEEKDAY_LABELS[date.getDay()] ?? '';
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
};

export const formatMonthTitle = (year: number, month: number): string =>
  `${year}년 ${month}월`;

// ---------------------------------------------------------------------------
// 검증
// ---------------------------------------------------------------------------

/** 저장 가능한 상태면 null, 아니면 사용자에게 보여줄 한국어 메시지. */
export const validateSwimLogDraft = (
  draft: SwimLogDraft,
  now: Date = new Date(),
): string | null => {
  if (draft.poolName.trim().length === 0) {
    return '수영장을 선택하거나 직접 입력해주세요.';
  }
  if (draft.poolName.trim().length > MAX_POOL_NAME_LENGTH) {
    return `수영장 이름은 ${MAX_POOL_NAME_LENGTH}자까지 입력할 수 있습니다.`;
  }

  const swamOn = parseIsoDate(draft.swamOn);
  if (!swamOn) return '날짜를 선택해주세요.';
  if (draft.swamOn > todayIsoDate(now)) {
    return '아직 오지 않은 날짜는 기록할 수 없습니다.';
  }

  if (draft.durationMin != null) {
    if (!Number.isInteger(draft.durationMin) || draft.durationMin < 1) {
      return '운동 시간은 1분 이상이어야 합니다.';
    }
    if (draft.durationMin > MAX_DURATION_MIN) {
      return '운동 시간은 24시간을 넘을 수 없습니다.';
    }
  }

  for (const stroke of SWIM_STROKES) {
    if (draft.distances[stroke] > MAX_DISTANCE_PER_STROKE_M) {
      return `영법별 거리는 ${MAX_DISTANCE_PER_STROKE_M.toLocaleString('ko-KR')}m를 넘을 수 없습니다.`;
    }
  }
  if (sumStrokeDistances(draft.distances) === 0) {
    return '거리를 하나 이상 입력해주세요.';
  }

  if (draft.memo.length > MAX_MEMO_LENGTH) {
    return `메모는 ${MAX_MEMO_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return null;
};
