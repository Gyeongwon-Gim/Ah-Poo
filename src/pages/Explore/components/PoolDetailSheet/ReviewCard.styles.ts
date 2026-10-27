import styled from '@emotion/styled';

export const StyledCard = styled.article<{ $isOwn: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
  padding: var(--ap-space-5);
  background: ${({ $isOwn }) =>
    $isOwn ? 'var(--ap-primary-tint)' : 'var(--ap-surface)'};
  border: 1px solid
    ${({ $isOwn }) =>
      $isOwn ? 'var(--ap-primary)' : 'var(--ap-border-neutral)'};
  border-radius: var(--ap-radius-md);
`;

export const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--ap-space-3);
`;

export const StyledUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ap-space-3);
`;

export const StyledAvatarPlaceholder = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ap-primary-tint);
  border-radius: var(--ap-radius-circle);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-primary);
`;

export const StyledUserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledUserName = styled.span`
  display: flex;
  align-items: center;
  gap: var(--ap-space-2);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);
  color: var(--ap-text);
`;

export const StyledOwnBadge = styled.span`
  padding: 2px var(--ap-space-2);
  background: var(--ap-primary);
  border-radius: var(--ap-radius-xs);
  font-size: var(--ap-font-xs);
  font-weight: var(--ap-font-weight-medium);
  color: white;
`;

export const StyledDate = styled.span`
  font-size: var(--ap-font-caption);
  color: var(--ap-text-muted);
`;

export const StyledContent = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  line-height: 1.5;
  color: var(--ap-text);
  white-space: pre-wrap;
  word-break: break-word;
`;

export const StyledImageList = styled.div`
  display: flex;
  gap: var(--ap-space-2);
  overflow-x: auto;
  padding-bottom: var(--ap-space-1);

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StyledImage = styled.img`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: var(--ap-radius-sm);
  background: var(--ap-neutral-100);
`;

export const StyledActions = styled.div`
  display: flex;
  gap: var(--ap-space-3);
  padding-top: var(--ap-space-3);
  border-top: 1px solid var(--ap-border-neutral);
`;

export const StyledActionButton = styled.button<{ $danger?: boolean }>`
  padding: var(--ap-space-2) var(--ap-space-4);
  background: none;
  border: 1px solid
    ${({ $danger }) =>
      $danger ? 'var(--ap-error)' : 'var(--ap-border-neutral)'};
  border-radius: var(--ap-radius-xs);
  font-size: var(--ap-font-caption);
  color: ${({ $danger }) => ($danger ? 'var(--ap-error)' : 'var(--ap-text)')};
  cursor: pointer;
  transition:
    background-color var(--ap-duration-fast) var(--ap-ease-out),
    border-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: ${({ $danger }) =>
      $danger ? 'var(--ap-error-bg)' : 'var(--ap-neutral-50)'};
  }
`;
