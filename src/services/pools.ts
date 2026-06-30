import type { Pool, PoolFlag, PoolRow } from '../types/pool';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PoolKey } from '../utils/poolKey';

/** bigint(0/1/null) → boolean */
export function isFlagOn(value: PoolFlag | null | undefined): boolean {
  return value === 1 || value === true;
}

/** Supabase `pools.roadaddress` → 앱 모델 `roadAddress` */
function roadAddressFromRow(row: PoolRow): string {
  return row.roadaddress ?? '';
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
    isWeekday: row.is_weekday,
    isSaturday: row.is_saturday,
    isSunday: row.is_sunday,
    isHoliday: row.is_holiday,
  };
}

export async function fetchPools(): Promise<Pool[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data, error } = await supabase
    .from('pools')
    .select('*')
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
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToPool(data as PoolRow) : null;
}

export async function fetchPoolByKey(
  key: PoolKey,
): Promise<Pool | null> {
  const { name, roadAddress, lat, lng } = key;

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data, error } = await supabase
    .from('pools')
    .select('*')
    .eq('name_ko', name)
    .eq('roadaddress', roadAddress)
    .eq('lat', lat)
    .eq('lng', lng)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToPool(data as PoolRow) : null;
}
