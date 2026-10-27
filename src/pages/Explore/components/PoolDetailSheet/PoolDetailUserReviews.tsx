import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components';
import { useAccountModal } from '@/components/AccountModal/AccountModal';
import { usePoolUserReviews } from '@/pages/Explore/hooks/usePoolUserReviews';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import {
  StyledContainer,
  StyledStatus,
  StyledError,
  StyledEmptyPrompt,
  StyledEmptyTitle,
  StyledEmptyText,
  StyledWriteButton,
  StyledWriteButtonSmall,
  StyledMyReviewSection,
  StyledReviewList,
  StyledSectionTitle,
  StyledLoadMoreButton,
} from './PoolDetailUserReviews.styles';

interface PoolDetailUserReviewsProps {
  poolId: string | undefined;
}

const PoolDetailUserReviews = ({ poolId }: PoolDetailUserReviewsProps) => {
  const { isAuthenticated } = useAuth();
  const { openAccount } = useAccountModal();

  const {
    reviews,
    myReview,
    totalCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    isSubmitting,
    loadMore,
    submitReview,
    editReview,
    removeReview,
  } = usePoolUserReviews(poolId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleWriteClick = useCallback(() => {
    if (isAuthenticated) {
      setShowReviewForm(true);
    } else {
      openAccount(() => setShowReviewForm(true));
    }
  }, [isAuthenticated, openAccount]);

  const handleSubmit = useCallback(
    async (data: { rating: number; content: string; images: File[] }) => {
      if (isEditing && myReview) {
        await editReview({
          rating: data.rating,
          content: data.content,
          imagesToAdd: data.images,
        });
        setIsEditing(false);
      } else {
        await submitReview(data);
        setShowReviewForm(false);
      }
    },
    [isEditing, myReview, editReview, submitReview],
  );

  const handleCancelForm = useCallback(() => {
    setShowReviewForm(false);
    setIsEditing(false);
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setShowReviewForm(true);
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await removeReview();
    setShowDeleteConfirm(false);
  }, [removeReview]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  if (isLoading) {
    return <StyledStatus>리뷰를 불러오는 중...</StyledStatus>;
  }

  if (error) {
    return <StyledError>{error}</StyledError>;
  }

  const isEmpty = !myReview && reviews.length === 0;
  const showEmptyPrompt = isEmpty && !showReviewForm;
  const shouldShowForm = showReviewForm || (myReview && isEditing);
  const showMyReview = myReview && !isEditing && !showReviewForm;

  return (
    <StyledContainer>
      {showEmptyPrompt && (
        <StyledEmptyPrompt>
          <StyledEmptyTitle>아직 리뷰가 없어요</StyledEmptyTitle>
          <StyledEmptyText>첫 번째 리뷰를 남겨주세요.</StyledEmptyText>
          <StyledWriteButton type="button" onClick={handleWriteClick}>
            리뷰 쓰기
          </StyledWriteButton>
        </StyledEmptyPrompt>
      )}

      {shouldShowForm && (
        <ReviewForm
          existingReview={isEditing ? myReview : null}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      )}

      {showMyReview && (
        <StyledMyReviewSection>
          <ReviewCard
            review={myReview}
            isOwn
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </StyledMyReviewSection>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="리뷰를 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {reviews.length > 0 && (
        <StyledReviewList>
          <StyledSectionTitle>
            다른 방문자 리뷰 ({totalCount - (myReview ? 1 : 0)})
          </StyledSectionTitle>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {hasMore && (
            <StyledLoadMoreButton
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '불러오는 중...' : '더보기'}
            </StyledLoadMoreButton>
          )}
        </StyledReviewList>
      )}

      {!isEmpty && !myReview && !showReviewForm && (
        <StyledWriteButtonSmall type="button" onClick={handleWriteClick}>
          리뷰 쓰기
        </StyledWriteButtonSmall>
      )}
    </StyledContainer>
  );
};

export default PoolDetailUserReviews;
