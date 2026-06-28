import { supabase, isSupabaseConfigured } from '../lib/supabase';

/** bigint(0/1/null) → boolean */
export function isFlagOn(value) {
  return value === 1 || value === true;
}

/** Supabase `pools.roadaddress` → 앱 모델 `roadAddress` */
function roadAddressFromRow(row) {
  return row.roadaddress ?? '';
}

export function mapRowToPool(row) {
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

export async function fetchPools() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data, error } = await supabase
    .from('pools')
    .select('*')
    .order('name_ko', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToPool);
}

export async function fetchPoolByKey({ name, roadAddress, lat, lng }) {
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
  return data ? mapRowToPool(data) : null;
}
