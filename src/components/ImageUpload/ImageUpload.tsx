import { useCallback, useRef, useId } from 'react';
import styled from '@emotion/styled';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_MAX_IMAGES = 3;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ImageUpload = ({
  images,
  onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  disabled = false,
  className,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const canAddMore = images.length < maxImages;

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) return;

      const availableSlots = maxImages - images.length;
      const filesToAdd = files.slice(0, availableSlots);

      const validFiles = filesToAdd.filter((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          console.warn(`지원하지 않는 파일 형식: ${file.type}`);
          return false;
        }
        if (file.size > maxSizeBytes) {
          console.warn(`파일 크기 초과: ${file.name}`);
          return false;
        }
        return true;
      });

      const newImages: ImageFile[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      onChange([...images, ...newImages]);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [images, maxImages, maxSizeBytes, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      onChange(images.filter((img) => img.id !== id));
    },
    [images, onChange],
  );

  const handleAddClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <StyledContainer className={className}>
      <StyledImageList>
        {images.map((image) => (
          <StyledImageItem key={image.id}>
            <StyledPreview src={image.previewUrl} alt="업로드된 이미지" />
            <StyledRemoveButton
              type="button"
              onClick={() => handleRemove(image.id)}
              aria-label="이미지 삭제"
              disabled={disabled}
            >
              ×
            </StyledRemoveButton>
          </StyledImageItem>
        ))}

        {canAddMore && (
          <StyledAddButton
            type="button"
            onClick={handleAddClick}
            disabled={disabled}
            aria-label="이미지 추가"
          >
            <StyledAddIcon>+</StyledAddIcon>
            <StyledAddText>
              {images.length}/{maxImages}
            </StyledAddText>
          </StyledAddButton>
        )}
      </StyledImageList>

      <StyledHiddenInput
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
      />

      <StyledHelpText>
        최대 {maxImages}장, 각 {Math.round(maxSizeBytes / 1024 / 1024)}MB 이하
      </StyledHelpText>
    </StyledContainer>
  );
};

export default ImageUpload;

export type { ImageFile };

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

const StyledImageList = styled.div`
  display: flex;
  gap: var(--ap-space-3);
  flex-wrap: wrap;
`;

const StyledImageItem = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--ap-radius-md);
  overflow: hidden;
`;

const StyledPreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledRemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: var(--ap-radius-circle);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledAddButton = styled.button`
  width: 72px;
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ap-space-1);
  background: var(--ap-neutral-50);
  border: 2px dashed var(--ap-neutral-200);
  border-radius: var(--ap-radius-md);
  cursor: pointer;
  transition:
    border-color var(--ap-duration-fast) var(--ap-ease-out),
    background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    border-color: var(--ap-primary);
    background: var(--ap-primary-tint);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledAddIcon = styled.span`
  font-size: var(--ap-font-title-lg);
  color: var(--ap-neutral-400);
  line-height: 1;
`;

const StyledAddText = styled.span`
  font-size: var(--ap-font-xs);
  color: var(--ap-text-muted);
`;

const StyledHiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const StyledHelpText = styled.p`
  font-size: var(--ap-font-caption);
  color: var(--ap-text-muted);
  margin: 0;
`;
