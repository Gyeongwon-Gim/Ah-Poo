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
      />

      <StyledTabContent role="tabpanel">
        {activeTab === 'user' && <PoolDetailUserReviews poolId={poolId} />}

        {activeTab === 'blog' && (
          <PoolDetailBlogSection
            loading={blogLoading}
            error={blogError}
            visibleReviews={visibleReviews}
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
  gap: var(--ap-space-4);
  margin-top: var(--ap-space-8);
`;

const StyledTabContent = styled.div`
  min-height: 200px;
`;
