import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPoolReviews,
  fetchUserReviewForPool,
  createReview,
  updateReview,
  deleteReview,
} from '@/services/userReviews';
import type {
  UserReview,
  CreateReviewParams,
  UpdateReviewParams,
} from '@/types/review';

interface UsePoolUserReviewsResult {
  reviews: UserReview[];
  myReview: UserReview | null;
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  isSubmitting: boolean;
  loadMore: () => Promise<void>;
  submitReview: (params: Omit<CreateReviewParams, 'poolId'>) => Promise<void>;
  editReview: (params: Omit<UpdateReviewParams, 'reviewId'>) => Promise<void>;
  removeReview: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePoolUserReviews = (
  poolId: string | undefined,
): UsePoolUserReviewsResult => {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [myReview, setMyReview] = useState<UserReview | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!poolId) return;

      try {
        const response = await fetchPoolReviews(poolId, pageNum);

        setReviews((prev) =>
          append ? [...prev, ...response.reviews] : response.reviews,
        );
        setTotalCount(response.totalCount);
        setHasMore(response.hasMore);
        setPage(pageNum);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.';
        setError(message);
      }
    },
    [poolId],
  );

  const fetchMyReview = useCallback(async () => {
    if (!poolId || !user) {
      setMyReview(null);
      return;
    }

    try {
      const review = await fetchUserReviewForPool(poolId, user.id);
      setMyReview(review);
    } catch {
      setMyReview(null);
    }
  }, [poolId, user]);

  const loadInitial = useCallback(async () => {
    if (!poolId) return;

    setIsLoading(true);
    setError(null);

    await Promise.all([fetchReviews(0, false), fetchMyReview()]);

    setIsLoading(false);
  }, [poolId, fetchReviews, fetchMyReview]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    await fetchReviews(page + 1, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, fetchReviews, page]);

  /**
   * submitReview/editReview/removeReview가 공유하는
   * "isSubmitting 토글 + 에러 메시지 추출 + setError + rethrow" 패턴을 감싼다.
   * fetchReviews/fetchMyReview는 isSubmitting과 무관하고 rethrow도 하지 않아 대상에서 제외.
   */
  const runMutation = useCallback(
    async <T>(mutate: () => Promise<T>, fallbackMessage: string): Promise<T> => {
      setIsSubmitting(true);
      setError(null);

      try {
        return await mutate();
      } catch (err) {
        const message = err instanceof Error ? err.message : fallbackMessage;
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const submitReview = useCallback(
    async (params: Omit<CreateReviewParams, 'poolId'>) => {
      if (!poolId) {
        throw new Error('수영장 정보가 없습니다.');
      }

      const newReview = await runMutation(
        () => createReview({ poolId, ...params }),
        '리뷰 등록에 실패했습니다.',
      );

      setMyReview(newReview);
      setReviews((prev) => [newReview, ...prev]);
      setTotalCount((prev) => prev + 1);
    },
    [poolId, runMutation],
  );

  const editReview = useCallback(
    async (params: Omit<UpdateReviewParams, 'reviewId'>) => {
      if (!myReview) {
        throw new Error('수정할 리뷰가 없습니다.');
      }

      const updatedReview = await runMutation(
        () => updateReview({ reviewId: myReview.id, ...params }),
        '리뷰 수정에 실패했습니다.',
      );

      setMyReview(updatedReview);
      setReviews((prev) =>
        prev.map((r) => (r.id === updatedReview.id ? updatedReview : r)),
      );
    },
    [myReview, runMutation],
  );

  const removeReview = useCallback(async () => {
    if (!myReview) {
      throw new Error('삭제할 리뷰가 없습니다.');
    }

    await runMutation(
      () => deleteReview(myReview.id),
      '리뷰 삭제에 실패했습니다.',
    );

    setMyReview(null);
    setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
    setTotalCount((prev) => prev - 1);
  }, [myReview, runMutation]);

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  const filteredReviews = useMemo(() => {
    if (!isAuthenticated || !myReview) return reviews;
    return reviews.filter((r) => r.id !== myReview.id);
  }, [reviews, myReview, isAuthenticated]);

  return {
    reviews: filteredReviews,
    myReview,
    totalCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    isSubmitting,
    loadMore,
    submitReview,
    editReview,
    removeReview,
    refresh,
  };
};
