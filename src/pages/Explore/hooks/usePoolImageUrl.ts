import { useCallback, useEffect, useState } from 'react';
import { fetchPoolImageUrl } from '@/services/poolImages';

export const usePoolImageUrl = (poolId: string | null | undefined) => {
  const [poolImageUrl, setPoolImageUrl] = useState<string | null>(null);
  const [poolImageFailed, setPoolImageFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(poolId));

  useEffect(() => {
    if (!poolId) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setPoolImageUrl(null);
    setPoolImageFailed(false);
    setLoading(true);

    fetchPoolImageUrl(poolId, { signal: controller.signal })
      .then((url) => {
        if (!controller.signal.aborted) {
          setPoolImageUrl(url);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setPoolImageUrl(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [poolId]);

  const markPoolImageFailed = useCallback(() => {
    setPoolImageFailed(true);
  }, []);

  return { poolImageUrl, poolImageFailed, loading, markPoolImageFailed };
};
