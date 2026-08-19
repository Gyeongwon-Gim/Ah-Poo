import { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { StarRating, ImageUpload } from '@/components';
import type { ImageFile } from '@/components/ImageUpload/ImageUpload';
import type { UserReview } from '@/types/review';

interface ReviewFormProps {
  existingReview?: UserReview | null;
  onSubmit: (data: {
    rating: number;
    content: string;
    images: File[];
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const MAX_CONTENT_LENGTH = 500;

const ReviewForm = ({
  existingReview,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? '');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingReview;
  const canSubmit =
    rating > 0 && content.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setContent(existingReview.content);
    }
  }, [existingReview]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CONTENT_LENGTH) {
        setContent(value);
        setError(null);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!canSubmit) return;

      setError(null);

      try {
        await onSubmit({
          rating,
          content: content.trim(),
          images: images.map((img) => img.file),
        });

        if (!isEditing) {
          setRating(0);
          setContent('');
          setImages([]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '리뷰 등록에 실패했습니다.';
        setError(message);
      }
    },
    [canSubmit, rating, content, images, onSubmit, isEditing],
  );

  return (
    <StyledForm onSubmit={handleSubmit}>
      <StyledSection>
        <StyledLabel>별점</StyledLabel>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </StyledSection>

      <StyledSection>
        <StyledLabelRow>
          <StyledLabel>리뷰</StyledLabel>
          <StyledCharCount $warning={content.length > MAX_CONTENT_LENGTH * 0.9}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </StyledCharCount>
        </StyledLabelRow>
        <StyledTextarea
          value={content}
          onChange={handleContentChange}
          placeholder="수영장 이용 경험을 공유해주세요"
          rows={4}
          disabled={isSubmitting}
        />
      </StyledSection>

      <StyledSection>
        <StyledLabel>사진 첨부 (선택)</StyledLabel>
        <ImageUpload
          images={images}
          onChange={setImages}
          maxImages={3}
          disabled={isSubmitting}
        />
      </StyledSection>

      {error && <StyledError>{error}</StyledError>}

      <StyledButtonRow>
        {onCancel && (
          <StyledCancelButton
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </StyledCancelButton>
        )}
        <StyledSubmitButton type="submit" disabled={!canSubmit}>
          {isSubmitting
            ? '등록 중...'
            : isEditing
              ? '수정하기'
              : '리뷰 등록'}
        </StyledSubmitButton>
      </StyledButtonRow>
    </StyledForm>
  );
};

export default ReviewForm;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  padding: var(--ap-space-5);
  background: var(--ap-neutral-50);
  border-radius: var(--ap-radius-md);
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

const StyledLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);
  color: var(--ap-text);
`;

const StyledCharCount = styled.span<{ $warning: boolean }>`
  font-size: var(--ap-font-caption);
  color: ${({ $warning }) =>
    $warning ? 'var(--ap-error)' : 'var(--ap-text-muted)'};
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: var(--ap-space-4);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  line-height: 1.5;
  color: var(--ap-text);
  resize: vertical;
  min-height: 100px;

  &::placeholder {
    color: var(--ap-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--ap-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledError = styled.p`
  margin: 0;
  padding: var(--ap-space-3);
  background: var(--ap-error-bg);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  color: var(--ap-error);
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: var(--ap-space-3);
`;

const StyledSubmitButton = styled.button`
  flex: 1;
  padding: var(--ap-space-4);
  background: var(--ap-primary);
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledCancelButton = styled.button`
  padding: var(--ap-space-4) var(--ap-space-6);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-neutral-100);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

