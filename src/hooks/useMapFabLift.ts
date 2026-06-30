import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

export const FAB_GAP = 12;
export const FAB_STACK_H = 94; // 42 + 10 + 42
export const HALF_SCREEN_RATIO = 0.5;
const NO_SHEET_TOP = Number.POSITIVE_INFINITY;

type SheetSource = 'search' | 'favorites' | 'detail';

interface SheetTops {
  search: number;
  favorites: number;
  detail: number;
}

interface ComputeMapFabPlacementParams {
  sheetTop: number;
  viewportHeight: number;
  defaultBottomPx: number;
}

interface MapFabPlacement {
  translateY: number;
  interactive: boolean;
}

interface UseMapFabLiftParams {
  enabled: boolean;
  detailOpen: boolean;
  searchPanelOpen: boolean;
  searchPanelHidden: boolean;
  favoritesPanelOpen: boolean;
}

function readSafeBottomPx() {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;padding-bottom:var(--safe-bottom)';
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return px;
}

function computeFabLift(
  sheetTop: number,
  viewportHeight: number,
  defaultBottomPx: number,
) {
  const desiredBottomFromViewportBottom = viewportHeight - sheetTop + FAB_GAP;
  return Math.max(0, desiredBottomFromViewportBottom - defaultBottomPx);
}

/**
 * 시트 top에 맞춰 FAB를 위로 올린다. 화면 50% 이상이면 50% 지점에서 멈추고 시트에 가려진다.
 */
export function computeMapFabPlacement({
  sheetTop,
  viewportHeight,
  defaultBottomPx,
}: ComputeMapFabPlacementParams): MapFabPlacement {
  const vh = viewportHeight;
  const halfTop = vh * HALF_SCREEN_RATIO;

  if (!Number.isFinite(sheetTop) || sheetTop >= vh) {
    return { translateY: 0, interactive: true };
  }

  if (sheetTop <= halfTop) {
    const lift = computeFabLift(halfTop, vh, defaultBottomPx);
    return { translateY: -lift, interactive: false };
  }

  const lift = computeFabLift(sheetTop, vh, defaultBottomPx);
  return { translateY: -lift, interactive: true };
}

/**
 * 하단 시트에 맞춰 FAB를 아래로 밀어 낸다 (시트와 겹치지 않음).
 */
export function useMapFabLift({
  enabled,
  detailOpen,
  searchPanelOpen,
  searchPanelHidden,
  favoritesPanelOpen,
}: UseMapFabLiftParams) {
  const [sheetTops, setSheetTops] = useState<SheetTops>({
    search: NO_SHEET_TOP,
    favorites: NO_SHEET_TOP,
    detail: NO_SHEET_TOP,
  });
  const [sheetDragging, setSheetDragging] = useState(false);
  const dragBySourceRef = useRef<Record<SheetSource, boolean>>({
    search: false,
    favorites: false,
    detail: false,
  });

  const syncSheetDragging = useCallback(() => {
    const next = Object.values(dragBySourceRef.current).some(Boolean);
    setSheetDragging((prev) => (prev === next ? prev : next));
  }, []);

  const makeDragHandler = useCallback(
    (source: SheetSource) => (dragging: boolean) => {
      if (dragBySourceRef.current[source] === dragging) return;
      dragBySourceRef.current[source] = dragging;
      syncSheetDragging();
    },
    [syncSheetDragging],
  );

  const onSearchSheetDragChange = useMemo(
    () => makeDragHandler('search'),
    [makeDragHandler],
  );
  const onFavoritesSheetDragChange = useMemo(
    () => makeDragHandler('favorites'),
    [makeDragHandler],
  );
  const onDetailSheetDragChange = useMemo(
    () => makeDragHandler('detail'),
    [makeDragHandler],
  );

  const defaultBottomPx = useMemo(() => 16 + readSafeBottomPx(), []);

  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 800,
  );

  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const syncViewport = () => {
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    };

    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.addEventListener('resize', syncViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.removeEventListener('resize', syncViewport);
    };
  }, [enabled]);

  const onSearchSheetTopChange = useCallback((top: number) => {
    setSheetTops((prev) =>
      prev.search === top ? prev : { ...prev, search: top },
    );
  }, []);

  const onFavoritesSheetTopChange = useCallback((top: number) => {
    setSheetTops((prev) =>
      prev.favorites === top ? prev : { ...prev, favorites: top },
    );
  }, []);

  const onDetailSheetTopChange = useCallback((top: number) => {
    setSheetTops((prev) =>
      prev.detail === top ? prev : { ...prev, detail: top },
    );
  }, []);

  const activeSheetTop = useMemo(() => {
    if (!enabled) return NO_SHEET_TOP;
    if (detailOpen) return sheetTops.detail;
    if (searchPanelOpen && !searchPanelHidden) return sheetTops.search;
    if (favoritesPanelOpen) return sheetTops.favorites;
    return NO_SHEET_TOP;
  }, [
    enabled,
    detailOpen,
    searchPanelOpen,
    searchPanelHidden,
    favoritesPanelOpen,
    sheetTops,
  ]);

  const placement = useMemo(() => {
    if (!enabled) {
      return { translateY: 0, interactive: false };
    }

    const vh = viewportHeight;

    return computeMapFabPlacement({
      sheetTop: activeSheetTop,
      viewportHeight: vh,
      defaultBottomPx,
    });
  }, [enabled, activeSheetTop, defaultBottomPx, viewportHeight]);

  const fabStyle = useMemo(
    () => ({
      transform: `translateY(${placement.translateY}px)`,
    }),
    [placement.translateY],
  );

  const defaultFabBottom = `${defaultBottomPx}px`;

  return {
    fabInteractive: placement.interactive,
    fabStyle,
    defaultFabBottom,
    sheetDragging,
    onSearchSheetTopChange,
    onFavoritesSheetTopChange,
    onDetailSheetTopChange,
    onSearchSheetDragChange,
    onFavoritesSheetDragChange,
    onDetailSheetDragChange,
  };
}
