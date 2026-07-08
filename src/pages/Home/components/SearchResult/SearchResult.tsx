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
import './SearchResult.css';

interface SearchResultPoolItemProps {
  pool: Pool;
  selected: boolean;
  onSelect: (pool: Pool) => void;
}

function SearchResultPoolItem({
  pool,
  selected,
  onSelect,
}: SearchResultPoolItemProps) {
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
        <ListItem.Media className="search-result__media">
          <img
            className="search-result__media-img"
            src={poolImageUrl}
            alt=""
            loading="lazy"
            onError={markPoolImageFailed}
          />
        </ListItem.Media>
      ) : (
        <ListItem.Media
          className="search-result__media search-result__media--placeholder"
          aria-hidden
        >
          <Waves size={20} />
        </ListItem.Media>
      )}

      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>{pool.name}</ListItem.Title>
            {show50mTag && (
              <span className="search-result__tag">50m</span>
            )}
          </ListItem.TitleRow>

          {(feeLabel || distanceLabel) && (
            <ListItem.Subline>
              {feeLabel && (
                <span x-apple-data-detectors="none">{feeLabel}</span>
              )}
              {feeLabel && distanceLabel && (
                <span className="search-result__dot" aria-hidden>
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
            className={`search-result__favorite ${
              favorite ? 'search-result__favorite--active' : ''
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

const MemoSearchResultPoolItem = memo(SearchResultPoolItem);

export interface SearchResultProps {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool?: (pool: Pool) => void;
  resetKey?: string | number;
  searchTerm?: string;
  behindDetail?: boolean;
  behindDetailInstant?: boolean;
  revealFromDetail?: boolean;
  interactionDisabled?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  reopenListRef?: MutableRefObject<(() => void) | null>;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function SearchResult({
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  searchTerm = '',
  behindDetail = false,
  behindDetailInstant = false,
  revealFromDetail = false,
  interactionDisabled = false,
  onCollapsedChange,
  reopenListRef,
  onTopChange,
  onDragChange,
}: SearchResultProps) {
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const sheet = useListSheet({
    resetKey,
    itemCount: pools.length,
    reservePeekWhenEmpty: true,
    behindDetail,
    behindDetailInstant,
    revealFromDetail,
    interactionDisabled,
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
      inert={sheet.inert}
      revealing={sheet.revealing}
      softSheet={sheet.softSheet}
      style={{ transform: `translateY(${sheet.translateY}px)` }}
      aria-label={`'${searchTerm}' 검색 결과`}
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
        <header className="search-result__header">
          <h2 className="search-result__title">
            검색 결과{' '}
            <span className="search-result__count">{pools.length}</span>건
          </h2>
        </header>
      </BottomSheet.PeekBar>

      <div ref={sheet.listRef} className="search-result__list" role="list">
        {pools.length === 0 ? (
          <div className="search-result__empty-slot" role="listitem">
            <p className="search-result__empty">검색 결과가 없습니다</p>
          </div>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <MemoSearchResultPoolItem
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
