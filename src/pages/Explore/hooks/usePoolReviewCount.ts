import { useEffect, useState } from 'react';
import { fetchPoolReviews } from '@/services/userReviews';

/** 상세 시트 헤더에 쓸 방문자 리뷰 개수만 가볍게 조회한다. */
export const usePoolReviewCount = (poolId: string | undefined) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!poolId) return;

    fetchPoolReviews(poolId, 0)
      .then((response) => setCount(response.totalCount))
      .catch(() => setCount(0));
  }, [poolId]);

  return count;
};
