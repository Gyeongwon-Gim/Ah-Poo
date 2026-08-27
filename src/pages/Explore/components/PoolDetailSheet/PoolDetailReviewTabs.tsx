import styled from '@emotion/styled';

type ReviewTab = 'user' | 'blog';

interface PoolDetailReviewTabsProps {
  activeTab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  userReviewCount: number;
}

const PoolDetailReviewTabs = ({
  activeTab,
  onTabChange,
  userReviewCount,
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
      </StyledTab>
    </StyledContainer>
  );
};

export default PoolDetailReviewTabs;

const StyledContainer = styled.div`
  display: flex;
  gap: var(--ap-space-1);
  padding: var(--ap-space-1);
  background: var(--ap-neutral-100);
  border-radius: var(--ap-radius-sm);
`;

const StyledTab = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ap-space-2);
  padding: var(--ap-space-5) var(--ap-space-3);
  background: ${({ $active }) =>
    $active ? 'var(--ap-surface)' : 'transparent'};
  border: none;
  border-radius: var(--ap-radius-xs);
  font-size: var(--ap-font-body-sm);
  font-weight: ${({ $active }) =>
    $active
      ? 'var(--ap-font-weight-semibold)'
      : 'var(--ap-font-weight-normal)'};
  color: ${({ $active }) => ($active ? 'var(--ap-text)' : 'var(--ap-text-muted)')};
  cursor: pointer;
  transition:
    background-color var(--ap-duration-fast) var(--ap-ease-out),
    color var(--ap-duration-fast) var(--ap-ease-out);
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
