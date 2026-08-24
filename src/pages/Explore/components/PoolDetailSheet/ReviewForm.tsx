import { useState, useCallback, useEffect } from 'react';
import { StarRating, ImageUpload } from '@/components';
import type { ImageFile } from '@/components/ImageUpload/ImageUpload';
import type { UserReview } from '@/types/review';
import {
  StyledForm,
  StyledSection,
  StyledLabelRow,
  StyledLabel,
  StyledCharCount,
  StyledTextarea,
  StyledError,
  StyledButtonRow,
  StyledSubmitButton,
  StyledCancelButton,
} from './ReviewForm.styles';

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
