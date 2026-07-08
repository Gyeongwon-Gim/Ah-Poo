import { useCallback, useEffect, useState } from 'react';
import {
  fetchMorePoolBlogReviews,
  fetchPoolBlogReviewsForPool,
  type PoolBlogReviewItem,
} from '@/services/naverBlog';
import type { Pool } from '@/types/pool';
import {
  BLOG_INITIAL_VISIBLE,
  BLOG_LOAD_MORE_STEP,
} from '@/pages/Explore/components/PoolDetailSheet';

export function usePoolBlogReviews(pool: Pool) {
  const [blogReviews, setBlogReviews] = useState<PoolBlogReviewItem[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogQuery, setBlogQuery] = useState('');
  const [blogNextStart, setBlogNextStart] = useState(1);
  const [visibleBlogCount, setVisibleBlogCount] =
    useState(BLOG_INITIAL_VISIBLE);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogLoadMoreLoading, setBlogLoadMoreLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogThumbFailed, setBlogThumbFailed] = useState<Set<string>>(
    () => new Set(),
  );
  const [blogRetryKey, setBlogRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBlogReviews([]);
    setBlogTotal(0);
    setBlogQuery('');
    setBlogNextStart(1);
    setVisibleBlogCount(BLOG_INITIAL_VISIBLE);
    setBlogError(null);
    setBlogThumbFailed(new Set());
    setBlogLoading(true);

    fetchPoolBlogReviewsForPool(pool, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setBlogReviews(result.items);
        setBlogTotal(result.total);
        setBlogQuery(result.query);
        setBlogNextStart(1 + result.fetchedCount);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setBlogError(
          err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        setBlogLoading(false);
      });

    return () => controller.abort();
  }, [pool, blogRetryKey]);

  const appendBlogReviews = useCallback((items: PoolBlogReviewItem[]) => {
    if (!items.length) return;
    setBlogReviews((prev) => {
      const seen = new Set(prev.map((item) => item.link));
      const next = [...prev];
      for (const item of items) {
        if (!seen.has(item.link)) {
          seen.add(item.link);
          next.push(item);
        }
      }
      return next;
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (blogLoadMoreLoading) return;

    if (visibleBlogCount < blogReviews.length) {
      setVisibleBlogCount((count) => count + BLOG_LOAD_MORE_STEP);
      return;
    }

    if (!blogQuery || blogNextStart > blogTotal) return;

    setBlogLoadMoreLoading(true);
    try {
      const result = await fetchMorePoolBlogReviews(pool, {
        query: blogQuery,
        start: blogNextStart,
        display: 10,
      });
      appendBlogReviews(result.items);
      setBlogTotal(result.total);
      setBlogNextStart(blogNextStart + result.fetchedCount);
      setVisibleBlogCount((count) => count + BLOG_LOAD_MORE_STEP);
    } catch (err) {
      setBlogError(
        err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.',
      );
    } finally {
      setBlogLoadMoreLoading(false);
    }
  }, [
    appendBlogReviews,
    blogLoadMoreLoading,
    blogNextStart,
    blogQuery,
    blogReviews.length,
    blogTotal,
    pool,
    visibleBlogCount,
  ]);

  const retry = useCallback(() => {
    setBlogRetryKey((key) => key + 1);
  }, []);

  const markThumbFailed = useCallback((link: string) => {
    setBlogThumbFailed((prev) => new Set(prev).add(link));
  }, []);

  const visibleReviews = blogReviews.slice(0, visibleBlogCount);
  const canLoadMore =
    visibleBlogCount < blogReviews.length ||
    blogReviews.length < blogTotal ||
    blogNextStart <= blogTotal;

  return {
    visibleReviews,
    totalReviews: blogReviews.length,
    blogLoading,
    blogLoadMoreLoading,
    blogError,
    blogThumbFailed,
    canLoadMore,
    loadMore,
    retry,
    markThumbFailed,
  };
}
