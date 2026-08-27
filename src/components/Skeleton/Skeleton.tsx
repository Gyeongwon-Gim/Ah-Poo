import styled from '@emotion/styled';

export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const Skeleton = ({
  width = '100%',
  height = '100%',
  borderRadius = 'var(--ap-radius-sm)',
  className,
}: SkeletonProps) => (
  <StyledSkeleton
    className={className}
    style={{ width, height, borderRadius }}
    aria-hidden
  />
);

export default Skeleton;

const StyledSkeleton = styled.div`
  background: linear-gradient(
    90deg,
    var(--ap-neutral-100) 25%,
    var(--ap-neutral-50) 50%,
    var(--ap-neutral-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--ap-neutral-100);
  }
`;
