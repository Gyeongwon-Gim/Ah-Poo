import styled from '@emotion/styled';

type ReviewTab = 'user' | 'blog';

interface PoolDetailReviewTabsProps {
  activeTab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  userReviewCount: number;
  blogReviewCount: number;
}

const PoolDetailReviewTabs = ({
  activeTab,
  onTabChange,
  userReviewCount,
  blogReviewCount,
}: PoolDetailReviewTabsProps) => {
  return (
    <StyledContainer role="tablist">
      <StyledTab
        type="button"
        role="tab"
        aria-selected={activeTab === 'user'}
        $active={activeTab === 'user'}
        onClick={() => onTabChange('user')}
      >
        방문자 리뷰
        {userReviewCount > 0 && (
          <StyledCount $active={activeTab === 'user'}>
            {userReviewCount}
          </StyledCount>
        )}
      </StyledTab>

      <StyledTab
        type="button"
        role="tab"
        aria-selected={activeTab === 'blog'}
        $active={activeTab === 'blog'}
        onClick={() => onTabChange('blog')}
      >
        블로그 리뷰
        {blogReviewCount > 0 && (
          <StyledCount $active={activeTab === 'blog'}>
            {blogReviewCount}
          </StyledCount>
        )}
      </StyledTab>
    </StyledContainer>
  );
};

export default PoolDetailReviewTabs;

const StyledContainer = styled.div`
  display: flex;
  gap: var(--ap-space-1);
  padding: 0 var(--ap-space-6);
  border-bottom: 1px solid var(--ap-border-neutral);
`;

const StyledTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--ap-space-2);
  padding: var(--ap-space-4) var(--ap-space-3);
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? 'var(--ap-primary)' : 'transparent')};
  font-size: var(--ap-font-body);
  font-weight: ${({ $active }) =>
    $active ? 'var(--ap-font-weight-semibold)' : 'var(--ap-font-weight-normal)'};
  color: ${({ $active }) => ($active ? 'var(--ap-primary)' : 'var(--ap-text-muted)')};
  cursor: pointer;
  transition:
    color var(--ap-duration-fast) var(--ap-ease-out),
    border-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    color: var(--ap-primary);
  }
`;

const StyledCount = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--ap-space-2);
  background: ${({ $active }) =>
    $active ? 'var(--ap-primary)' : 'var(--ap-neutral-200)'};
  border-radius: var(--ap-radius-full);
  font-size: var(--ap-font-xs);
  font-weight: var(--ap-font-weight-medium);
  color: ${({ $active }) => ($active ? 'white' : 'var(--ap-text-muted)')};
`;
