import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET = 'pool-images';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/** poolId → public URL | null (없는 경우도 캐시) */
const urlCache = new Map();

export function getPoolImagePublicUrl(poolId, extension) {
  if (!isSupabaseConfigured || !supabase || !poolId || !extension) {
    return null;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${poolId}.${extension}`);

  return data.publicUrl;
}

async function probePoolImageUrl(poolId, signal) {
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
      if (err.name === 'AbortError') throw err;
    }
  }

  return null;
}

/** Storage에 `{poolId}.{jpg|jpeg|png|webp}` 형태로 저장된 대표 이미지 URL 조회 */
export async function fetchPoolImageUrl(poolId, { signal } = {}) {
  if (!poolId) return null;
  if (urlCache.has(poolId)) return urlCache.get(poolId);

  const url = await probePoolImageUrl(poolId, signal);
  urlCache.set(poolId, url);
  return url;
}
