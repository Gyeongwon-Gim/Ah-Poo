import { memo, useEffect, type MutableRefObject } from 'react';
import { Star, Waves } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import ListItem from '@/components/ListItem';
import { useFavorites } from '@/hooks/useFavorites';
import { usePoolImageUrl } from '@/hooks/usePoolImageUrl';
import { useListSheet } from '@/pages/Home/hooks/useListSheet';
import { isFlagOn } from '@/services/pools';
import { formatDailyAdmissionFee } from '@/utils/formatFee';
import { formatDistance } from '@/utils/formatDistance';
import { getPoolListKey } from '@/utils/poolKey';
import type { Pool } from '@/types/pool';
import './Favorites.css';

interface FavoritesPoolItemProps {
  pool: Pool;
  selected: boolean;
  onSelect: (pool: Pool) => void;
}

function FavoritesPoolItem({ pool, selected, onSelect }: FavoritesPoolItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const distanceLabel = formatDistance(pool.distanceKm);
  const feeLabel = pool.fee ? formatDailyAdmissionFee(pool.fee) : null;
  const { poolImageUrl, poolImageFailed, markPoolImageFailed } =
    usePoolImageUrl(pool.id);
  const show50mTag = isFlagOn(pool.is50m);

  return (
    <ListItem selected={selected} onSelect={() => onSelect(pool)}>
      {poolImageUrl && !poolImageFailed ? (
        <ListItem.Media className="favorites__media">
          <img
            className="favorites__media-img"
            src={poolImageUrl}
            alt=""
            loading="lazy"
            onError={markPoolImageFailed}
          />
        </ListItem.Media>
      ) : (
        <ListItem.Media
          className="favorites__media favorites__media--placeholder"
          aria-hidden
        >
          <Waves size={20} />
        </ListItem.Media>
      )}

      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>{pool.name}</ListItem.Title>
            {show50mTag && <span className="favorites__tag">50m</span>}
          </ListItem.TitleRow>

          {(feeLabel || distanceLabel) && (
            <ListItem.Subline>
              {feeLabel && (
                <span x-apple-data-detectors="none">{feeLabel}</span>
              )}
              {feeLabel && distanceLabel && (
                <span className="favorites__dot" aria-hidden>
                  ·
                </span>
              )}
              {distanceLabel && (
                <span x-apple-data-detectors="none">{distanceLabel}</span>
              )}
            </ListItem.Subline>
          )}

          <ListItem.Description x-apple-data-detectors="none">
            {pool.roadAddress}
          </ListItem.Description>
        </ListItem.Content>

        <ListItem.Trailing>
          <button
            type="button"
            className={`favorites__favorite ${
              favorite ? 'favorites__favorite--active' : ''
            }`}
            aria-label="즐겨찾기"
            aria-pressed={favorite}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(pool);
            }}
          >
            <Star
              size={18}
              strokeWidth={1.5}
              fill={favorite ? 'currentColor' : 'none'}
            />
          </button>
        </ListItem.Trailing>
      </ListItem.Body>
    </ListItem>
  );
}

const MemoFavoritesPoolItem = memo(FavoritesPoolItem);

export interface FavoritesProps {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool?: (pool: Pool) => void;
  resetKey?: string | number;
  onCollapsedChange?: (collapsed: boolean) => void;
  reopenListRef?: MutableRefObject<(() => void) | null>;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function Favorites({
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  onCollapsedChange,
  reopenListRef,
  onTopChange,
  onDragChange,
}: FavoritesProps) {
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const sheet = useListSheet({
    resetKey,
    itemCount: pools.length,
    reservePeekWhenEmpty: true,
    collapseToHandle: true,
    onCollapsedChange,
    onTopChange,
    onDragChange,
  });

  useEffect(() => {
    if (!reopenListRef) return undefined;
    reopenListRef.current = sheet.expandFromCollapsed;
    return () => {
      reopenListRef.current = null;
    };
  }, [reopenListRef, sheet.expandFromCollapsed]);

  return (
    <BottomSheet
      ref={sheet.sectionRef}
      variant="list"
      as="section"
      ready={sheet.ready}
      expanded={sheet.expanded}
      collapsed={sheet.collapsed}
      dragging={sheet.dragging}
      instant={sheet.instant}
      softSheet={sheet.softSheet}
      style={{ transform: `translateY(${sheet.translateY}px)` }}
      aria-label="즐겨찾기"
      onTouchStartCapture={sheet.handleTouchStart}
      onTouchEndCapture={sheet.handleTouchEnd}
      onTouchCancelCapture={sheet.handleTouchEnd}
      onMouseDown={sheet.handleMouseDown}
    >
      <BottomSheet.PeekBar
        ref={sheet.barRef}
        onClick={sheet.toggleExpanded}
        role="presentation"
      >
        <BottomSheet.Handle
          ref={sheet.handleRef}
          ariaLabel={
            sheet.collapsed
              ? '목록 펼치기'
              : sheet.expanded
                ? '목록 접기'
                : '목록 펼치기'
          }
          onClick={(e) => {
            e.stopPropagation();
            sheet.toggleExpanded();
          }}
        />
        <header className="favorites__header">
          <h2 className="favorites__title">
            즐겨찾기{' '}
            <span className="favorites__count">{pools.length}</span>곳
          </h2>
        </header>
      </BottomSheet.PeekBar>

      <div ref={sheet.listRef} className="favorites__list" role="list">
        {pools.length === 0 ? (
          <div className="favorites__empty-slot" role="listitem">
            <p className="favorites__empty">즐겨찾기한 수영장이 없어요</p>
          </div>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <MemoFavoritesPoolItem
                pool={pool}
                selected={selectedKey === getPoolListKey(pool)}
                onSelect={(p) => onSelectPool?.(p)}
              />
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
