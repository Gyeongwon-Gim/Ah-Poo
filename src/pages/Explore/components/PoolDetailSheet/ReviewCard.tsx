import { StarRating } from '@/components';
import { getReviewImageUrl } from '@/services/userReviews';
import type { UserReview } from '@/types/review';
import {
  StyledCard,
  StyledHeader,
  StyledUserInfo,
  StyledAvatar,
  StyledAvatarPlaceholder,
  StyledUserMeta,
  StyledUserName,
  StyledOwnBadge,
  StyledDate,
  StyledContent,
  StyledImageList,
  StyledImage,
  StyledActions,
  StyledActionButton,
} from './ReviewCard.styles';

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
