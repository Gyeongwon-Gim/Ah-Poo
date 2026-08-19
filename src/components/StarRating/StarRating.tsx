import { useCallback } from 'react';
import styled from '@emotion/styled';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STAR_COUNT = 5;

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  className,
}: StarRatingProps) => {
  const handleClick = useCallback(
    (starValue: number) => {
      if (readonly) return;
      onChange?.(starValue);
    },
    [readonly, onChange],
  );

  const handleKeyDown = useCallback(
    (starValue: number, event: React.KeyboardEvent) => {
      if (readonly) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onChange?.(starValue);
      }
    },
    [readonly, onChange],
  );

  return (
    <StyledContainer className={className} role="group" aria-label="별점">
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= value;

        return (
          <StyledStar
            key={starValue}
            type="button"
            $active={isActive}
            $readonly={readonly}
            $size={size}
            onClick={() => handleClick(starValue)}
            onKeyDown={(e) => handleKeyDown(starValue, e)}
            tabIndex={readonly ? -1 : 0}
            aria-label={`${starValue}점`}
            aria-pressed={isActive}
          >
            ★
          </StyledStar>
        );
      })}
    </StyledContainer>
  );
};

export default StarRating;

const StyledContainer = styled.div`
  display: flex;
  gap: var(--ap-space-1);
`;

const sizeMap = {
  sm: 'var(--ap-font-body)',
  md: 'var(--ap-font-title-lg)',
  lg: '28px',
};

const StyledStar = styled.button<{
  $active: boolean;
  $readonly: boolean;
  $size: 'sm' | 'md' | 'lg';
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: none;
  font-size: ${({ $size }) => sizeMap[$size]};
  line-height: 1;
  color: ${({ $active }) =>
    $active ? 'var(--ap-favorite)' : 'var(--ap-neutral-200)'};
  cursor: ${({ $readonly }) => ($readonly ? 'default' : 'pointer')};
  transition: color var(--ap-duration-fast) var(--ap-ease-out),
    transform var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    color: ${({ $readonly, $active }) =>
      $readonly ? ($active ? 'var(--ap-favorite)' : 'var(--ap-neutral-200)') : 'var(--ap-favorite)'};
    transform: ${({ $readonly }) => ($readonly ? 'none' : 'scale(1.1)')};
  }

  &:active {
    transform: ${({ $readonly }) => ($readonly ? 'none' : 'scale(0.95)')};
  }

  &:focus-visible {
    outline: 2px solid var(--ap-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;
