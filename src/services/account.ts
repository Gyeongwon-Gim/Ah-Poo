import { assertSupabaseConfigured } from '@/lib/supabase';

interface StorageEntry {
  name: string;
  id: string | null;
}

const listAll = async (prefix: string): Promise<StorageEntry[]> => {
  const client = assertSupabaseConfigured();
  const bucket = client.storage.from('review-images');
  const entries: StorageEntry[] = [];
  const limit = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await bucket.list(prefix, { limit, offset });
    if (error) throw error;

    const batch = (data ?? []) as StorageEntry[];
    entries.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return entries;
};

const collectPaths = async (prefix: string): Promise<string[]> => {
  const entries = await listAll(prefix);
  const paths: string[] = [];

  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      const nested = await collectPaths(path);
      paths.push(...nested);
    } else {
      paths.push(path);
    }
  }

  return paths;
};

/** 탈퇴 전에 본인 리뷰 이미지 객체를 비운다. 행은 auth.users cascade로 지워진다. */
export const deleteOwnReviewImages = async (userId: string): Promise<void> => {
  const client = assertSupabaseConfigured();
  const paths = await collectPaths(userId);
  if (paths.length === 0) return;

  const { error } = await client.storage.from('review-images').remove(paths);
  if (error) throw error;
};
