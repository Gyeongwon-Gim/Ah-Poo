import { assertSupabaseConfigured } from '@/lib/supabase';
import { buildStrokeColumns, monthRange } from '@/utils/swimLog';
import type {
  CreateSwimLogParams,
  SwimLog,
  UpdateSwimLogParams,
} from '@/types/swimLog';

/**
 * total_distance_m은 DB 생성 컬럼이라 insert/update payload에 넣으면 Postgres가 거부한다.
 * 읽을 때만 select에 포함된다.
 */
const SWIM_LOG_COLUMNS = '*';

interface SwimLogRow {
  id: string;
  user_id: string;
  pool_id: string | null;
  pool_name: string;
  swam_on: string;
  duration_min: number | null;
  freestyle_m: number;
  backstroke_m: number;
  breaststroke_m: number;
  butterfly_m: number;
  total_distance_m: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

const mapRowToSwimLog = (row: SwimLogRow): SwimLog => ({
  id: row.id,
  user_id: row.user_id,
  pool_id: row.pool_id,
  pool_name: row.pool_name,
  swam_on: row.swam_on,
  duration_min: row.duration_min,
  freestyle_m: row.freestyle_m,
  backstroke_m: row.backstroke_m,
  breaststroke_m: row.breaststroke_m,
  butterfly_m: row.butterfly_m,
  total_distance_m: row.total_distance_m,
  memo: row.memo,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/** 뮤테이션에 쓸 로그인 사용자. RLS와 별개로 user_id를 직접 채우기 위해 필요하다. */
const requireUser = async (client: ReturnType<typeof assertSupabaseConfigured>) => {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }
  return user;
};

/**
 * 특정 월의 내 기록 전부. 캘린더가 월 단위로 그려지고 한 달치는 많아야 수십 건이라
 * 페이지네이션이 필요 없다. month는 1~12.
 * RLS가 이미 본인 것만 주지만 방어적으로 user_id도 필터한다.
 */
export const fetchSwimLogsByMonth = async (
  year: number,
  month: number,
): Promise<SwimLog[]> => {
  const client = assertSupabaseConfigured();
  const user = await requireUser(client);
  const { from, to } = monthRange(year, month);

  const { data, error } = await client
    .from('swim_logs')
    .select(SWIM_LOG_COLUMNS)
    .eq('user_id', user.id)
    .gte('swam_on', from)
    .lte('swam_on', to)
    .order('swam_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapRowToSwimLog(row as unknown as SwimLogRow));
};

export const fetchSwimLogById = async (logId: string): Promise<SwimLog | null> => {
  const client = assertSupabaseConfigured();

  const { data, error } = await client
    .from('swim_logs')
    .select(SWIM_LOG_COLUMNS)
    .eq('id', logId)
    .maybeSingle();

  if (error) throw error;

  return data ? mapRowToSwimLog(data as unknown as SwimLogRow) : null;
};

export const createSwimLog = async ({
  poolId,
  poolName,
  swamOn,
  durationMin,
  distances,
  memo,
}: CreateSwimLogParams): Promise<SwimLog> => {
  const client = assertSupabaseConfigured();
  const user = await requireUser(client);

  const { data, error } = await client
    .from('swim_logs')
    .insert({
      user_id: user.id,
      pool_id: poolId,
      pool_name: poolName.trim(),
      swam_on: swamOn,
      duration_min: durationMin,
      ...buildStrokeColumns(distances),
      memo: memo?.trim() || null,
    })
    .select(SWIM_LOG_COLUMNS)
    .single();

  if (error) throw error;

  return mapRowToSwimLog(data as unknown as SwimLogRow);
};

export const updateSwimLog = async ({
  logId,
  poolId,
  poolName,
  swamOn,
  durationMin,
  distances,
  memo,
}: UpdateSwimLogParams): Promise<SwimLog> => {
  const client = assertSupabaseConfigured();
  const user = await requireUser(client);

  const updates: Record<string, unknown> = {};
  if (poolId !== undefined) updates.pool_id = poolId;
  if (poolName !== undefined) updates.pool_name = poolName.trim();
  if (swamOn !== undefined) updates.swam_on = swamOn;
  if (durationMin !== undefined) updates.duration_min = durationMin;
  if (memo !== undefined) updates.memo = memo?.trim() || null;
  if (distances !== undefined) Object.assign(updates, buildStrokeColumns(distances));

  if (Object.keys(updates).length === 0) {
    const existing = await fetchSwimLogById(logId);
    if (!existing) throw new Error('기록을 찾을 수 없습니다.');
    return existing;
  }

  // RLS를 믿지 않고 user_id도 함께 건다.
  const { data, error } = await client
    .from('swim_logs')
    .update(updates)
    .eq('id', logId)
    .eq('user_id', user.id)
    .select(SWIM_LOG_COLUMNS)
    .single();

  if (error) throw error;

  return mapRowToSwimLog(data as unknown as SwimLogRow);
};

export const deleteSwimLog = async (logId: string): Promise<void> => {
  const client = assertSupabaseConfigured();
  const user = await requireUser(client);

  const { error } = await client
    .from('swim_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id);

  if (error) throw error;
};
