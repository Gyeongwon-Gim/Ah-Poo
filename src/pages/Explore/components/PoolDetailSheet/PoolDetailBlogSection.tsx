import { formatPostDate } from '@/services/naverBlog';
import type { PoolBlogReviewItem } from '@/services/naverBlog';

interface PoolDetailBlogSectionProps {
  loading: boolean;
  error: string | null;
  visibleReviews: PoolBlogReviewItem[];
  totalReviews: number;
  canLoadMore: boolean;
  loadMoreLoading: boolean;
  thumbFailed: Set<string>;
  onRetry: () => void;
  onLoadMore: () => void;
  onThumbError: (link: string) => void;
}

const PoolDetailBlogSection = ({
  loading,
  error,
  visibleReviews,
  totalReviews,
  canLoadMore,
  loadMoreLoading,
  thumbFailed,
  onRetry,
  onLoadMore,
  onThumbError,
}: PoolDetailBlogSectionProps) => {
  return (
    <section className="pool-sheet__blog" aria-live="polite">
      <h3 className="pool-sheet__blog-title">블로그 리뷰</h3>
      {loading && (
        <p className="pool-sheet__blog-status">리뷰를 불러오는 중…</p>
      )}
      {!loading && error && (
        <div className="pool-sheet__blog-error">
          <p className="pool-sheet__blog-status pool-sheet__blog-status--error">
            {error}
          </p>
          <button
            type="button"
            className="pool-sheet__blog-retry"
            onClick={onRetry}
          >
            다시 시도
          </button>
        </div>
      )}
      {!loading && !error && visibleReviews.length > 0 && (
        <div className="pool-sheet__blog-list">
          {visibleReviews.map((review) => (
            <a
              key={review.link}
              className="pool-sheet__blog-card"
              href={review.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {review.thumbnailUrl && !thumbFailed.has(review.link) && (
                <img
                  className="pool-sheet__blog-thumb"
                  src={review.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  onError={() => onThumbError(review.link)}
                />
              )}
              <span className="pool-sheet__blog-body">
                <span className="pool-sheet__blog-link">{review.title}</span>
                {review.description && (
                  <span className="pool-sheet__blog-desc">
                    {review.description}
                  </span>
                )}
                <span className="pool-sheet__blog-meta">
                  {review.bloggerName}
                  {review.postDate && (
                    <>
                      <span className="pool-sheet__blog-meta-dot">·</span>
                      {formatPostDate(review.postDate)}
                    </>
                  )}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
      {!loading && !error && canLoadMore && totalReviews > 0 && (
        <button
          type="button"
          className="pool-sheet__blog-more"
          onClick={onLoadMore}
          disabled={loadMoreLoading}
        >
          {loadMoreLoading ? '불러오는 중…' : '펼쳐서 더보기'}
        </button>
      )}
      {!loading && !error && totalReviews === 0 && (
        <p className="pool-sheet__blog-status">관련 리뷰를 찾지 못했어요</p>
      )}
      <p className="pool-sheet__blog-attribution">검색 결과 제공: NAVER</p>
    </section>
  );
};

export default PoolDetailBlogSection;
