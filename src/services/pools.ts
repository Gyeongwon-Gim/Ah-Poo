import type { Pool, PoolFlag, PoolOperatingHour, PoolRow } from '@/types/pool';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const POOL_SELECT_WITH_HOURS =
  '*, pool_operating_hours(day_of_week, open_time, close_time, closed)';

/** bigint(0/1/null) → boolean */
export function isFlagOn(value: PoolFlag | null | undefined): boolean {
  return value === 1 || value === true;
}

/** Supabase `pools.roadaddress` → 앱 모델 `roadAddress` */
function roadAddressFromRow(row: PoolRow): string {
  return row.roadaddress ?? '';
}

function operatingHoursFromRow(row: PoolRow): PoolOperatingHour[] | undefined {
  if (!row.pool_operating_hours?.length) return undefined;
  return row.pool_operating_hours.map((h) => ({
    dayOfWeek: h.day_of_week,
    openTime: h.open_time,
    closeTime: h.close_time,
    closed: h.closed,
  }));
}

export function mapRowToPool(row: PoolRow): Pool {
  return {
    id: row.id,
    name: row.name_ko,
    roadAddress: roadAddressFromRow(row),
    lat: Number(row.lat),
    lng: Number(row.lng),
    fee: row.fee ?? '',
    official_url: row.official_url ?? '',
    url2: row.url2 ?? '',
    phone: String(row.phone ?? '').trim(),
    is50m: row.is_50m,
    operatingHours: operatingHoursFromRow(row),
  };
}

export async function fetchPools(): Promise<Pool[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data, error } = await supabase
    .from('pools')
    .select(POOL_SELECT_WITH_HOURS)
    .order('name_ko', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapRowToPool(row as PoolRow));
}

export async function fetchPoolById(id: string): Promise<Pool | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data, error } = await supabase
    .from('pools')
    .select(POOL_SELECT_WITH_HOURS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToPool(data as PoolRow) : null;
}
