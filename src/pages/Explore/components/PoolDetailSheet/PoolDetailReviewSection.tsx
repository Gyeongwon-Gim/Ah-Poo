import { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import PoolDetailReviewTabs from './PoolDetailReviewTabs';
import PoolDetailUserReviews from './PoolDetailUserReviews';
import PoolDetailBlogSection from './PoolDetailBlogSection';
import type { PoolBlogReviewItem } from '@/services/naverBlog';

type ReviewTab = 'user' | 'blog';

interface PoolDetailReviewSectionProps {
  poolId: string | undefined;
  userReviewCount: number;
  blogLoading: boolean;
  blogError: string | null;
  visibleReviews: PoolBlogReviewItem[];
  totalReviews: number;
  canLoadMore: boolean;
  loadMoreLoading: boolean;
  thumbFailed: Set<string>;
  onBlogRetry: () => void;
  onBlogLoadMore: () => void;
  onBlogThumbError: (link: string) => void;
}

const PoolDetailReviewSection = ({
  poolId,
  userReviewCount,
  blogLoading,
  blogError,
  visibleReviews,
  totalReviews,
  canLoadMore,
  loadMoreLoading,
  thumbFailed,
  onBlogRetry,
  onBlogLoadMore,
  onBlogThumbError,
}: PoolDetailReviewSectionProps) => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('blog');

  const handleTabChange = useCallback((tab: ReviewTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <StyledContainer>
      <PoolDetailReviewTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userReviewCount={userReviewCount}
        blogReviewCount={totalReviews}
      />

      <StyledTabContent role="tabpanel">
        {activeTab === 'user' && <PoolDetailUserReviews poolId={poolId} />}

        {activeTab === 'blog' && (
          <PoolDetailBlogSection
            loading={blogLoading}
            error={blogError}
            visibleReviews={visibleReviews}
            totalReviews={totalReviews}
            canLoadMore={canLoadMore}
            loadMoreLoading={loadMoreLoading}
            thumbFailed={thumbFailed}
            onRetry={onBlogRetry}
            onLoadMore={onBlogLoadMore}
            onThumbError={onBlogThumbError}
          />
        )}
      </StyledTabContent>
    </StyledContainer>
  );
};

export default PoolDetailReviewSection;

const StyledContainer = styled.section`
  display: flex;
  flex-direction: column;
`;

const StyledTabContent = styled.div`
  min-height: 200px;
`;
