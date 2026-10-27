export const SWIM_STROKES = [
  'freestyle',
  'backstroke',
  'breaststroke',
  'butterfly',
] as const;

export type SwimStroke = (typeof SWIM_STROKES)[number];

/** 영법 → 거리(m). 키가 유한 유니온이라 noUncheckedIndexedAccess의 영향을 받지 않는다. */
export type StrokeDistances = Record<SwimStroke, number>;

export const STROKE_LABELS: Record<SwimStroke, string> = {
  freestyle: '자유형',
  backstroke: '배영',
  breaststroke: '평영',
  butterfly: '접영',
};

/** 영법 → swim_logs 컬럼명. 서비스와 유틸이 공유하는 단일 진실. */
export const STROKE_COLUMNS = {
  freestyle: 'freestyle_m',
  backstroke: 'backstroke_m',
  breaststroke: 'breaststroke_m',
  butterfly: 'butterfly_m',
} as const satisfies Record<SwimStroke, string>;

/**
 * 바퀴를 세는 방식. 사람마다 달라서 UI에서 명시적으로 고르게 한다.
 * 'oneWay'   = 편도 1회 (25m 레인이면 25m)
 * 'roundTrip'= 왕복 1회 (25m 레인이면 50m)
 */
export type LapCountMode = 'oneWay' | 'roundTrip';

/** 지원하는 레인 길이(m). */
export type LaneLength = 25 | 50;

export interface SwimLog {
  id: string;
  user_id: string;
  pool_id: string | null;
  pool_name: string;
  /** 'YYYY-MM-DD' */
  swam_on: string;
  duration_min: number | null;
  freestyle_m: number;
  backstroke_m: number;
  breaststroke_m: number;
  butterfly_m: number;
  /** DB 생성 컬럼. insert/update payload에 절대 넣지 않는다. */
  total_distance_m: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSwimLogParams {
  poolId: string | null;
  poolName: string;
  swamOn: string;
  durationMin: number | null;
  /** 항상 미터 단위. 바퀴는 입력 편의 레이어라 여기까지 오지 않는다. */
  distances: StrokeDistances;
  memo: string | null;
}

export interface UpdateSwimLogParams extends Partial<CreateSwimLogParams> {
  logId: string;
}

/** 월간 요약 헤더용 집계 */
export interface SwimLogStats {
  logCount: number;
  totalDistanceM: number;
  totalDurationMin: number;
  strokeTotals: StrokeDistances;
}

/** 폼 입력 중간 상태. 저장 직전에 CreateSwimLogParams로 정규화한다. */
export interface SwimLogDraft {
  poolId: string | null;
  poolName: string;
  swamOn: string;
  durationMin: number | null;
  distances: StrokeDistances;
  memo: string;
}

/** 캘린더 그리드의 셀 하나. */
export interface MonthGridCell {
  /** 'YYYY-MM-DD' */
  date: string;
  day: number;
  /** 이번 달이 아닌 앞뒤 패딩 셀이면 false */
  inMonth: boolean;
}
