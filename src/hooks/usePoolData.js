import { useState, useEffect, useCallback } from 'react';
import { fetchPools } from '../services/pools';

/** 수영장 목록 로딩/에러 상태와 재시도 함수를 제공한다. */
export function usePoolData() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPools();
      setPools(data);
    } catch (err) {
      setError(err.message ?? '수영장 목록을 불러오지 못했습니다.');
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { pools, loading, error, reload };
}
