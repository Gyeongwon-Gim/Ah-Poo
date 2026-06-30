import { useCallback, useEffect, useState } from 'react';
import { fetchPoolImageUrl } from '../services/poolImages';

export function usePoolImageUrl(poolId: string | null | undefined) {
  const [poolImageUrl, setPoolImageUrl] = useState<string | null>(null);
  const [poolImageFailed, setPoolImageFailed] = useState(false);

  useEffect(() => {
    if (!poolId) return undefined;

    const controller = new AbortController();
    setPoolImageUrl(null);
    setPoolImageFailed(false);

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
      });

    return () => controller.abort();
  }, [poolId]);

  const markPoolImageFailed = useCallback(() => {
    setPoolImageFailed(true);
  }, []);

  return { poolImageUrl, poolImageFailed, markPoolImageFailed };
}
