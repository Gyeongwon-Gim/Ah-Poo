import { useEffect, type MutableRefObject } from 'react';
import BottomSheet from '@/components/BottomSheet';
import { useListSheet } from '@/pages/Explore/hooks/useListSheet';
import { getPoolListKey } from '@/utils/poolKey';
import type { Pool } from '@/types/pool';
import type { PoolListPreset } from './presets';
import PoolListItem from './PoolListItem';
import './PoolListSheet.css';

export interface PoolListSheetProps extends PoolListPreset {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool?: (pool: Pool) => void;
  resetKey?: string | number;
  onCollapsedChange?: (collapsed: boolean) => void;
  reopenListRef?: MutableRefObject<(() => void) | null>;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
  // 검색 결과 전용(다른 패널에서는 미전달 → 기본값으로 현행과 동일 동작)
  behindDetail?: boolean;
  behindDetailInstant?: boolean;
  revealFromDetail?: boolean;
  interactionDisabled?: boolean;
}

export default function PoolListSheet({
  ariaLabel,
  title,
  countSuffix,
  emptyMessage,
  testId,
  countTestId,
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  onCollapsedChange,
  reopenListRef,
  onTopChange,
  onDragChange,
  behindDetail = false,
  behindDetailInstant = false,
  revealFromDetail = false,
  interactionDisabled = false,
}: PoolListSheetProps) {
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
      aria-label={ariaLabel}
      data-testid={testId}
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
        <header className="pool-list__header">
          <h2 className="pool-list__title">
            {title}{' '}
            <span className="pool-list__count" data-testid={countTestId}>
              {pools.length}
            </span>
            {countSuffix}
          </h2>
        </header>
      </BottomSheet.Header>

      <div ref={sheet.listRef} className="pool-list__list" role="list">
        {pools.length === 0 ? (
          <div className="pool-list__empty-slot" role="listitem">
            <p className="pool-list__empty">{emptyMessage}</p>
          </div>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <PoolListItem
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
