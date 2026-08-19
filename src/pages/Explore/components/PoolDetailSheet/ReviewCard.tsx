import styled from '@emotion/styled';
import { StarRating } from '@/components';
import { getReviewImageUrl } from '@/services/userReviews';
import type { UserReview } from '@/types/review';

interface ReviewCardProps {
  review: UserReview;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ReviewCard = ({
  review,
  isOwn = false,
  onEdit,
  onDelete,
}: ReviewCardProps) => {
  const userName = review.user?.user_metadata?.name ?? '익명';
  const avatarUrl = review.user?.user_metadata?.avatar_url;

  return (
    <StyledCard $isOwn={isOwn}>
      <StyledHeader>
        <StyledUserInfo>
          {avatarUrl ? (
            <StyledAvatar src={avatarUrl} alt={userName} />
          ) : (
            <StyledAvatarPlaceholder>{userName[0]}</StyledAvatarPlaceholder>
          )}
          <StyledUserMeta>
            <StyledUserName>
              {userName}
              {isOwn && <StyledOwnBadge>내 리뷰</StyledOwnBadge>}
            </StyledUserName>
            <StyledDate>{formatDate(review.created_at)}</StyledDate>
          </StyledUserMeta>
        </StyledUserInfo>

        <StarRating value={review.rating} readonly size="sm" />
      </StyledHeader>

      <StyledContent>{review.content}</StyledContent>

      {review.images && review.images.length > 0 && (
        <StyledImageList>
          {review.images.map((image) => (
            <StyledImage
              key={image.id}
              src={getReviewImageUrl(image.image_path)}
              alt="리뷰 이미지"
              loading="lazy"
            />
          ))}
        </StyledImageList>
      )}

      {isOwn && (onEdit || onDelete) && (
        <StyledActions>
          {onEdit && (
            <StyledActionButton onClick={onEdit}>수정</StyledActionButton>
          )}
          {onDelete && (
            <StyledActionButton onClick={onDelete} $danger>
              삭제
            </StyledActionButton>
          )}
        </StyledActions>
      )}
    </StyledCard>
  );
};

export default ReviewCard;

const StyledCard = styled.article<{ $isOwn: boolean }>`
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

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--ap-space-3);
`;

const StyledUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ap-space-3);
`;

const StyledAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: var(--ap-radius-circle);
  object-fit: cover;
  background: var(--ap-neutral-100);
`;

const StyledAvatarPlaceholder = styled.div`
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

const StyledUserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledUserName = styled.span`
  display: flex;
  align-items: center;
  gap: var(--ap-space-2);
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);
  color: var(--ap-text);
`;

const StyledOwnBadge = styled.span`
  padding: 2px var(--ap-space-2);
  background: var(--ap-primary);
  border-radius: var(--ap-radius-xs);
  font-size: var(--ap-font-xs);
  font-weight: var(--ap-font-weight-medium);
  color: white;
`;

const StyledDate = styled.span`
  font-size: var(--ap-font-caption);
  color: var(--ap-text-muted);
`;

const StyledContent = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  line-height: 1.5;
  color: var(--ap-text);
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledImageList = styled.div`
  display: flex;
  gap: var(--ap-space-2);
  overflow-x: auto;
  padding-bottom: var(--ap-space-1);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledImage = styled.img`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  object-fit: cover;
  border-radius: var(--ap-radius-sm);
  background: var(--ap-neutral-100);
`;

const StyledActions = styled.div`
  display: flex;
  gap: var(--ap-space-3);
  padding-top: var(--ap-space-3);
  border-top: 1px solid var(--ap-border-neutral);
`;

const StyledActionButton = styled.button<{ $danger?: boolean }>`
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
