import styled from '@emotion/styled';

export const StyledContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  padding: var(--ap-space-5) var(--ap-space-6);
`;

export const StyledStatus = styled.p`
  padding: var(--ap-space-8);
  text-align: center;
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
`;

export const StyledError = styled.p`
  padding: var(--ap-space-5);
  margin: var(--ap-space-5) var(--ap-space-6);
  background: var(--ap-error-bg);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-error);
  text-align: center;
`;

export const StyledEmptyPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ap-space-4);
  padding: var(--ap-space-10) var(--ap-space-6);
`;

export const StyledEmptyTitle = styled.h3`
  margin: 0;
  font-size: var(--ap-font-title);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

export const StyledEmptyText = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
`;

export const StyledWriteButton = styled.button`
  margin-top: var(--ap-space-3);
  padding: var(--ap-space-4) var(--ap-space-8);
  background: var(--ap-primary);
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: var(--ap-primary-dark);
  }
`;

export const StyledWriteButtonSmall = styled.button`
  padding: var(--ap-space-4);
  background: var(--ap-primary);
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: var(--ap-primary-dark);
  }
`;

export const StyledMyReviewSection = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
`;

export const StyledSectionTitle = styled.h4`
  margin: 0;
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

export const StyledLoadMoreButton = styled.button`
  padding: var(--ap-space-4);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  color: var(--ap-text-muted);
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-neutral-50);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
