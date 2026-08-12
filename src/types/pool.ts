export type PoolFlag = 0 | 1 | boolean;

/** 0=일 … 6=토 (Date#getDay()와 동일한 기준) */
export interface PoolOperatingHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
}

export interface Pool {
  id?: string;
  name: string;
  roadAddress: string;
  lat: number;
  lng: number;
  fee: string;
  official_url: string;
  url2: string;
  phone: string;
  is50m: PoolFlag;
  distanceKm?: number;
  /** 요일별 운영시간. 데이터가 없는(=알 수 없는) 수영장은 undefined/빈 배열. */
  operatingHours?: PoolOperatingHour[];
}

export interface PoolOperatingHourRow {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
}

export interface PoolRow {
  id: string;
  name_ko: string;
  roadaddress: string | null;
  lat: number | string;
  lng: number | string;
  fee: string | null;
  official_url: string | null;
  url2: string | null;
  phone: string | number | null;
  is_50m: PoolFlag;
  pool_operating_hours?: PoolOperatingHourRow[] | null;
}
