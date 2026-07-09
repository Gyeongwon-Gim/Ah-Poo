import { memo, useEffect, type MutableRefObject } from 'react';
import { Star, Waves } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import ListItem from '@/components/ListItem';
import Pool50mBadge from '@/components/Pool50mBadge';
import PoolStatusTag from '@/components/PoolStatusTag';
import { useFavorites } from '@/hooks/useFavorites';
import { usePoolImageUrl } from '@/hooks/usePoolImageUrl';
import { useListSheet } from '@/pages/Explore/hooks/useListSheet';
import { isFlagOn } from '@/services/pools';
import { formatDailyAdmissionFee } from '@/utils/formatFee';
import { formatDistance } from '@/utils/formatDistance';
import { getPoolListKey } from '@/utils/poolKey';
import type { Pool } from '@/types/pool';
import './Pools50m.css';

interface Pools50mItemProps {
  pool: Pool;
  selected: boolean;
  onSelect: (pool: Pool) => void;
}

function Pools50mItem({ pool, selected, onSelect }: Pools50mItemProps) {
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
        <ListItem.Media className="pools50m__media">
          <img
            className="pools50m__media-img"
            src={poolImageUrl}
            alt=""
            loading="lazy"
            onError={markPoolImageFailed}
          />
        </ListItem.Media>
      ) : (
        <ListItem.Media
          className="pools50m__media pools50m__media--placeholder"
          aria-hidden
        >
          <Waves size={20} />
        </ListItem.Media>
      )}

      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>{pool.name}</ListItem.Title>
            <PoolStatusTag pool={pool} />
            {show50mTag && <Pool50mBadge />}
          </ListItem.TitleRow>

          {(feeLabel || distanceLabel) && (
            <ListItem.Subline>
              {feeLabel && (
                <span x-apple-data-detectors="none">{feeLabel}</span>
              )}
              {feeLabel && distanceLabel && (
                <span className="pools50m__dot" aria-hidden>
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
            className={`pools50m__favorite ${
              favorite ? 'pools50m__favorite--active' : ''
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

const MemoPools50mItem = memo(Pools50mItem);

export interface Pools50mProps {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool?: (pool: Pool) => void;
  resetKey?: string | number;
  onCollapsedChange?: (collapsed: boolean) => void;
  reopenListRef?: MutableRefObject<(() => void) | null>;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function Pools50m({
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  onCollapsedChange,
  reopenListRef,
  onTopChange,
  onDragChange,
}: Pools50mProps) {
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
      aria-label="50m 레인"
      data-testid="pools50m-panel"
      onTouchStartCapture={sheet.handleTouchStart}
      onTouchEndCapture={sheet.handleTouchEnd}
      onTouchCancelCapture={sheet.handleTouchEnd}
      onMouseDown={sheet.handleMouseDown}
    >
      <BottomSheet.Header ref={sheet.headerRef}>
        <BottomSheet.Handle
          ref={sheet.handleRef}
          ariaLabel={
            sheet.collapsed
              ? '목록 펼치기'
              : sheet.expanded
                ? '목록 접기'
                : '목록 숨기기'
          }
          onClick={(e) => {
            e.stopPropagation();
            sheet.toggleHandle();
          }}
        />
        <header className="pools50m__header">
          <h2 className="pools50m__title">
            50m 레인{' '}
            <span className="pools50m__count" data-testid="pools50m-count">
              {pools.length}
            </span>
            곳
          </h2>
        </header>
      </BottomSheet.Header>

      <div ref={sheet.listRef} className="pools50m__list" role="list">
        {pools.length === 0 ? (
          <div className="pools50m__empty-slot" role="listitem">
            <p className="pools50m__empty">등록된 50m 수영장이 없어요</p>
          </div>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <MemoPools50mItem
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
