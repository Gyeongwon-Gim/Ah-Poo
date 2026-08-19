import { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components';
import { usePoolUserReviews } from '@/pages/Explore/hooks/usePoolUserReviews';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';

interface PoolDetailUserReviewsProps {
  poolId: string | undefined;
}

const PoolDetailUserReviews = ({ poolId }: PoolDetailUserReviewsProps) => {
  const { isAuthenticated } = useAuth();

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
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleWriteClick = useCallback(() => {
    if (isAuthenticated) {
      setShowReviewForm(true);
    } else {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false);
    setShowReviewForm(true);
  }, []);

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

      {showDeleteConfirm && (
        <StyledConfirmOverlay onClick={handleCancelDelete}>
          <StyledConfirmDialog onClick={(e) => e.stopPropagation()}>
            <StyledConfirmText>리뷰를 삭제하시겠습니까?</StyledConfirmText>
            <StyledConfirmButtons>
              <StyledConfirmButton type="button" onClick={handleCancelDelete}>
                취소
              </StyledConfirmButton>
              <StyledConfirmButton
                type="button"
                $danger
                onClick={handleConfirmDelete}
              >
                삭제
              </StyledConfirmButton>
            </StyledConfirmButtons>
          </StyledConfirmDialog>
        </StyledConfirmOverlay>
      )}

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

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </StyledContainer>
  );
};

export default PoolDetailUserReviews;

const StyledContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  padding: var(--ap-space-5) var(--ap-space-6);
`;

const StyledStatus = styled.p`
  padding: var(--ap-space-8);
  text-align: center;
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
`;

const StyledError = styled.p`
  padding: var(--ap-space-5);
  margin: var(--ap-space-5) var(--ap-space-6);
  background: var(--ap-error-bg);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-error);
  text-align: center;
`;

const StyledEmptyPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ap-space-4);
  padding: var(--ap-space-10) var(--ap-space-6);
`;

const StyledEmptyTitle = styled.h3`
  margin: 0;
  font-size: var(--ap-font-title);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

const StyledEmptyText = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
`;

const StyledWriteButton = styled.button`
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

const StyledWriteButtonSmall = styled.button`
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

const StyledMyReviewSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-4);
`;

const StyledSectionTitle = styled.h4`
  margin: 0;
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-semibold);
  color: var(--ap-text);
`;

const StyledLoadMoreButton = styled.button`
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

const StyledConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ap-overlay);
  z-index: 1000;
`;

const StyledConfirmDialog = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  width: 280px;
  padding: var(--ap-space-6);
  background: var(--ap-surface);
  border-radius: var(--ap-radius);
  box-shadow: var(--ap-shadow-sheet);
`;

const StyledConfirmText = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  color: var(--ap-text);
  text-align: center;
`;

const StyledConfirmButtons = styled.div`
  display: flex;
  gap: var(--ap-space-3);
`;

const StyledConfirmButton = styled.button<{ $danger?: boolean }>`
  flex: 1;
  padding: var(--ap-space-4);
  background: ${({ $danger }) =>
    $danger ? 'var(--ap-error)' : 'var(--ap-neutral-100)'};
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: ${({ $danger }) => ($danger ? 'white' : 'var(--ap-text)')};
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: ${({ $danger }) =>
      $danger ? 'var(--ap-error-dark)' : 'var(--ap-neutral-200)'};
  }
`;
