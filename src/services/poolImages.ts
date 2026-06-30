import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET = 'pool-images';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** poolId → public URL | null (없는 경우도 캐시) */
const urlCache = new Map<string, string | null>();

export function getPoolImagePublicUrl(
  poolId: string | null | undefined,
  extension: string | null | undefined,
): string | null {
  if (!isSupabaseConfigured || !supabase || !poolId || !extension) {
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${poolId}.${extension}`);

  return data.publicUrl;
}

async function probePoolImageUrl(
  poolId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  for (const ext of EXTENSIONS) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const url = getPoolImagePublicUrl(poolId, ext);
    if (!url) continue;

    try {
      const response = await fetch(url, { method: 'HEAD', signal });
      if (response.ok) return url;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof Error && err.name === 'AbortError') throw err;
    }
  }

  return null;
}

export interface FetchPoolImageUrlOptions {
  signal?: AbortSignal;
}

/** Storage에 `{poolId}.{jpg|jpeg|png|webp}` 형태로 저장된 대표 이미지 URL 조회 */
export async function fetchPoolImageUrl(
  poolId: string | null | undefined,
  { signal }: FetchPoolImageUrlOptions = {},
): Promise<string | null> {
  if (!poolId) return null;
  if (urlCache.has(poolId)) return urlCache.get(poolId) ?? null;

  const url = await probePoolImageUrl(poolId, signal);
  urlCache.set(poolId, url);
  return url;
}
