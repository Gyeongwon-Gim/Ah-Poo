import type { MouseEvent, PointerEvent } from 'react';
import BottomSheet from '@/components/BottomSheet';
import { formatDistanceKmLabel } from '@/utils/formatDistance';
import { openNaverDirections } from '@/utils/naverDirectionsUrl';
import { usePoolImageUrl } from '@/hooks/usePoolImageUrl';
import { useFavorites } from '@/hooks/useFavorites';
import { usePoolBlogReviews } from '@/hooks/usePoolBlogReviews';
import { usePoolDetailSheetLayout } from './hooks/usePoolDetailSheetLayout';
import type { Pool } from '@/types/pool';
import PoolDetailToolbar from './PoolDetailToolbar';
import PoolDetailContent from './PoolDetailContent';
import PoolDetailBlogSection from './PoolDetailBlogSection';
import './PoolDetailSheet.css';

interface PoolDetailSheetProps {
  pool: Pool;
  onClose: () => void;
  onCloseStart?: () => void;
  onBack?: () => void;
  onBackStart?: () => void;
  instantEnter?: boolean;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function PoolDetailSheet({
  pool,
  onClose,
  onCloseStart,
  onBack,
  onBackStart,
  instantEnter = false,
  onTopChange,
  onDragChange,
}: PoolDetailSheetProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const { poolImageUrl, poolImageFailed, markPoolImageFailed } =
    usePoolImageUrl(pool.id);
  const blog = usePoolBlogReviews(pool);

  const sheet = usePoolDetailSheetLayout({
    pool,
    instantEnter,
    poolImageUrl,
    onClose,
    onCloseStart,
    onBack,
    onBackStart,
    onTopChange,
    onDragChange,
  });

  if (!pool) return null;

  const distanceLabel =
    typeof pool.distanceKm === 'number'
      ? formatDistanceKmLabel(pool.distanceKm)
      : null;

  const handleDirections = () => {
    openNaverDirections(pool);
  };

  const handleShare = async () => {
    const shareUrl = pool.id
      ? `${window.location.origin}/?pool=${pool.id}`
      : window.location.href;
    const shareData = {
      title: pool.name,
      text: `${pool.name} · ${pool.roadAddress}`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      /* 사용자가 공유를 취소함 */
    }
  };

  const handleCopyAddress = async () => {
    if (!pool.roadAddress) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pool.roadAddress);
      }
    } catch {
      /* 복사 취소 또는 권한 거부 */
    }
  };

  const handleOpenHomepage = () => {
    if (!pool.official_url) return;
    window.open(pool.official_url, '_blank', 'noopener,noreferrer');
  };

  const stopPointer = (e: PointerEvent | MouseEvent) => e.stopPropagation();

  const contentProps = {
    pool,
    poolImageUrl,
    poolImageFailed,
    onPoolImageError: markPoolImageFailed,
    distanceLabel,
    onCopyAddress: handleCopyAddress,
    onShare: handleShare,
    onDirections: handleDirections,
    onOpenHomepage: pool.official_url ? handleOpenHomepage : undefined,
    essentialRef: sheet.contentEssentialRef,
    onPointerDownStop: stopPointer,
  };

  const sheetClassName = [
    sheet.phase === 'entering' ? 'pool-sheet--entering' : '',
    (sheet.phase === 'exiting' || sheet.snapTransition) &&
    !sheet.dragging &&
    !sheet.expandDragging &&
    !sheet.headerDragging
      ? 'pool-sheet--transition'
      : '',
    sheet.isFullscreen ? 'pool-sheet--fullscreen' : '',
    sheet.expandPhase !== 'idle' ? 'pool-sheet--expanding' : '',
    sheet.expandDragging ? 'pool-sheet--expand-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const sheetStyle =
    sheet.phase === 'entering' && !sheet.isFullscreen
      ? undefined
      : sheet.isFullscreen
        ? { transform: 'translateX(-50%)' }
        : { transform: `translate(-50%, ${sheet.translateRef.current}px)` };

  return (
    <BottomSheet
      ref={sheet.sheetRef}
      variant="detail"
      as="div"
      dragging={
        sheet.dragging || sheet.expandDragging || sheet.headerDragging
      }
      className={sheetClassName}
      style={sheetStyle}
      onAnimationEnd={sheet.handleEnterEnd}
      onTransitionEnd={sheet.handleExpandTransitionEnd}
      role="dialog"
      aria-label={`${pool.name} 상세`}
    >
      <div ref={sheet.grabberRef} className="pool-sheet__grabber">
        <BottomSheet.Header ref={sheet.headerRef}>
          <BottomSheet.Handle
            ariaLabel="전체 보기"
            onPointerDown={sheet.onHeaderPointerDown}
            onPointerMove={sheet.onHeaderPointerMove}
            onPointerUp={sheet.onHeaderPointerUp}
            onPointerCancel={sheet.onHeaderPointerCancel}
          />
        </BottomSheet.Header>

        <div ref={sheet.toolbarRef} className="pool-sheet__toolbar-wrap">
          <PoolDetailToolbar
            favorite={favorite}
            onToggleFavorite={toggleFavorite}
            pool={pool}
            onBack={sheet.handleBack}
            onClose={sheet.handleClose}
            onPointerDownStop={stopPointer}
          />
        </div>

        <div
          ref={sheet.peekBodyRef}
          className="pool-sheet__peek-body"
          onPointerDown={sheet.onPeekBodyPointerDown}
          onPointerMove={sheet.onPeekBodyPointerMove}
          onPointerUp={sheet.onPeekBodyPointerUp}
          onPointerCancel={sheet.onPeekBodyPointerCancel}
        >
          <div className="pool-sheet__body">
            <PoolDetailContent {...contentProps} />
            <PoolDetailBlogSection
              loading={blog.blogLoading}
              error={blog.blogError}
              visibleReviews={blog.visibleReviews}
              totalReviews={blog.totalReviews}
              canLoadMore={blog.canLoadMore}
              loadMoreLoading={blog.blogLoadMoreLoading}
              thumbFailed={blog.blogThumbFailed}
              onRetry={blog.retry}
              onLoadMore={blog.loadMore}
              onThumbError={blog.markThumbFailed}
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
