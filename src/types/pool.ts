export type PoolFlag = 0 | 1 | boolean;

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
  isWeekday: PoolFlag;
  isSaturday: PoolFlag;
  isSunday: PoolFlag;
  isHoliday: PoolFlag;
  distanceKm?: number;
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
  is_weekday: PoolFlag;
  is_saturday: PoolFlag;
  is_sunday: PoolFlag;
  is_holiday: PoolFlag;
}
