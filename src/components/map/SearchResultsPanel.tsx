import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import SearchResultItem from './SearchResultItem';
import { computeDragTranslate } from '../../hooks/useBottomSheet';
import { clamp } from '../../utils/clamp';
import { getPoolListKey } from '../../utils/poolKey';
import { runSheetInertia } from '../../utils/sheetInertia';
import type { Pool } from '../../types/pool';
import './SearchResultsPanel.css';

const TOP = 50;
const FALLBACK_PEEK = 200;
const MOVE_THRESHOLD = 3;
const VELOCITY_SNAP = 0.5;
const WHEEL_END_MS = 120;
const SNAP_EPSILON = 8;
const INERTIA_FRICTION = 0.92;
const MIN_FLING_VELOCITY = 0.25;
const VELOCITY_SMOOTH_PREV = 0.6;
const VELOCITY_SMOOTH_INST = 0.4;

function readCssVarPx(varName: string) {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(' +
    varName +
    ')';
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

const getContainerH = (el: HTMLElement | null) => {
  if (typeof document === 'undefined') return 800;
  const vv = window.visualViewport?.height;
  if (vv) return Math.round(vv);
  const home = el?.closest?.('.home') ?? document.querySelector('.home');
  return (home as HTMLElement | null)?.clientHeight ?? window.innerHeight;
};

interface SearchResultsPanelProps {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool?: (pool: Pool) => void;
  resetKey?: string | number;
  titlePrefix?: string;
  countSuffix?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  behindDetail?: boolean;
  behindDetailInstant?: boolean;
  revealFromDetail?: boolean;
  interactionDisabled?: boolean;
  reservePeekWhenEmpty?: boolean;
  liftPeekForNav?: boolean;
  enterFromBottom?: boolean;
  softSheet?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onDismissStart?: () => void;
  onDismiss?: () => void;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function SearchResultsPanel({
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  titlePrefix = '검색 결과',
  countSuffix = '건',
  emptyMessage = '검색 결과가 없습니다',
  ariaLabel = '목록',
  behindDetail = false,
  behindDetailInstant = false,
  revealFromDetail = false,
  interactionDisabled = false,
  reservePeekWhenEmpty = false,
  liftPeekForNav = false,
  enterFromBottom = false,
  softSheet = false,
  onExpandedChange,
  onDismissStart,
  onDismiss,
  onTopChange,
  onDragChange,
}: SearchResultsPanelProps) {
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const behindDetailRef = useRef(behindDetail);
  const revealFromDetailRef = useRef(revealFromDetail);
  const interactionDisabledRef = useRef(interactionDisabled);

  behindDetailRef.current = behindDetail;
  revealFromDetailRef.current = revealFromDetail;
  interactionDisabledRef.current = interactionDisabled;

  const [peekTop, setPeekTop] = useState(() => getContainerH(null) - FALLBACK_PEEK);
  const [translateY, setTranslateYState] = useState(() =>
    enterFromBottom ? getContainerH(null) : getContainerH(null) - FALLBACK_PEEK,
  );
  const [expanded, setExpandedState] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const translateRef = useRef(translateY);
  const peekTopRef = useRef(peekTop);
  const expandedRef = useRef(expanded);
  const contentHRef = useRef(0);
  const startYRef = useRef(0);
  const startTranslateRef = useRef(0);
  const movingRef = useRef(false);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const onDismissRef = useRef(onDismiss);
  const onDismissStartRef = useRef(onDismissStart);
  const onTopChangeRef = useRef(onTopChange);
  const onDragChangeRef = useRef(onDragChange);
  const dismissingRef = useRef(false);
  const enteringRef = useRef(enterFromBottom);
  const wheelEndTimerRef = useRef<number | null>(null);
  const inertiaCancelRef = useRef<(() => void) | null>(null);
  const prevExpandedRef = useRef(expanded);

  onDismissRef.current = onDismiss;
  onDismissStartRef.current = onDismissStart;
  onTopChangeRef.current = onTopChange;
  onDragChangeRef.current = onDragChange;

  peekTopRef.current = peekTop;

  const setTranslateY = (v: number) => {
    translateRef.current = v;
    setTranslateYState(v);
    onTopChangeRef.current?.(v);
  };

  const setInstant = (instant: boolean) => {
    sectionRef.current?.classList.toggle('is-instant', instant);
  };

  const hiddenTranslateY = () => getContainerH(sectionRef.current);

  const getContentBottomY = () => {
    const containerH = getContainerH(sectionRef.current);
    return containerH - contentHRef.current;
  };

  const getExpandedY = () => {
    const bottom = getContentBottomY();
    return canBrowseContent() ? TOP : Math.max(TOP, bottom);
  };

  const getDragMinY = () => {
    return canBrowseContent() ? Math.min(TOP, getContentBottomY()) : getExpandedY();
  };

  const getDragMaxY = () => {
    if (onDismissRef.current) return hiddenTranslateY();
    return peekTopRef.current;
  };

  const canBrowseContent = () => {
    const containerH = getContainerH(sectionRef.current);
    return contentHRef.current > containerH - TOP + 20;
  };

  const clampTranslateY = (y: number) => clamp(y, getDragMinY(), getDragMaxY());

  const isNearSnapPoint = (current: number, point: number) =>
    Math.abs(current - point) < SNAP_EPSILON;

  const isInBrowseRange = (current = translateRef.current) => {
    if (!canBrowseContent()) return false;
    const peek = peekTopRef.current;
    const expandedY = getExpandedY();
    if (isNearSnapPoint(current, expandedY) || isNearSnapPoint(current, peek)) {
      return false;
    }
    const minY = getDragMinY();
    return current >= minY - 1 && current <= peek - SNAP_EPSILON;
  };

  const dismissSheet = () => {
    if (dismissingRef.current || !onDismissRef.current) return;
    dismissingRef.current = true;
    onDismissStartRef.current?.();
    setExpanded(false);
    setInstant(false);
    setTranslateY(hiddenTranslateY());
    window.setTimeout(() => {
      onDismissRef.current?.();
      dismissingRef.current = false;
    }, 380);
  };

  const setExpanded = (v: boolean) => {
    expandedRef.current = v;
    setExpandedState(v);
    onExpandedChange?.(v);
  };

  useEffect(() => {
    onTopChangeRef.current?.(translateRef.current);
  }, [translateY, ready, behindDetail, revealFromDetail]);

  useEffect(() => {
    onDragChangeRef.current?.(dragging);
    return () => onDragChangeRef.current?.(false);
  }, [dragging]);

  const measureContentH = () => {
    const el = sectionRef.current;
    if (!el) return;
    contentHRef.current = el.offsetHeight;
    if (!movingRef.current && translateRef.current < getDragMinY()) {
      setTranslateY(getDragMinY());
    }
  };

  const measurePeek = () => {
    measureContentH();
    const barH = barRef.current?.offsetHeight ?? 60;
    const firstItemEl = listRef.current?.firstElementChild;
    const useFirstSlot =
      pools.length > 0 || (reservePeekWhenEmpty && pools.length === 0);
    const firstItemH =
      useFirstSlot && firstItemEl instanceof HTMLElement
        ? firstItemEl.offsetHeight
        : 0;
    const navLift = liftPeekForNav ? readCssVarPx('--sheet-bottom-reserve') : 0;
    const peekVisibleH = barH + firstItemH + navLift;
    const next = Math.round(getContainerH(sectionRef.current) - peekVisibleH);
    peekTopRef.current = next;
    setPeekTop(next);
    if (
      !movingRef.current &&
      !expandedRef.current &&
      !behindDetailRef.current &&
      !dismissingRef.current &&
      !enteringRef.current
    ) {
      const current = translateRef.current;
      const peek = next;
      const atPeek = Math.abs(current - peek) < 2;
      if (atPeek) setTranslateY(peek);
    }
  };

  useLayoutEffect(() => {
    measurePeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools, reservePeekWhenEmpty]);

  useEffect(() => {
    const section = sectionRef.current;
    const bar = barRef.current;
    const firstItem = listRef.current?.firstElementChild;
    if (!section && !bar && !firstItem) return undefined;

    const ro = new ResizeObserver(() => measurePeek());
    if (section) ro.observe(section);
    if (bar) ro.observe(bar);
    if (firstItem) ro.observe(firstItem);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools]);

  useEffect(() => {
    const onResize = () => measurePeek();
    window.addEventListener('resize', onResize);
    window.addEventListener('screen-resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('screen-resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enterFromBottom) setReady(true);
  }, [enterFromBottom]);

  useEffect(() => {
    setExpanded(false);
    measurePeek();
    setTranslateY(peekTopRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (
      movingRef.current ||
      behindDetail ||
      revealFromDetail ||
      dismissingRef.current ||
      enteringRef.current
    ) {
      return;
    }

    const toggled = prevExpandedRef.current !== expanded;
    prevExpandedRef.current = expanded;

    if (expanded) {
      setTranslateY(clampTranslateY(getExpandedY()));
      return;
    }

    if (toggled) {
      setTranslateY(clampTranslateY(peekTop));
      return;
    }

    if (Math.abs(translateRef.current - peekTop) < 2) {
      setTranslateY(clampTranslateY(peekTop));
    }
  }, [expanded, peekTop, behindDetail, revealFromDetail]);

  useLayoutEffect(() => {
    if (!enterFromBottom) return;

    enteringRef.current = true;
    setExpanded(false);
    measurePeek();

    const hidden = hiddenTranslateY();
    setInstant(true);
    setTranslateY(hidden);
    setReady(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setInstant(false);
        setTranslateY(peekTopRef.current);
        enteringRef.current = false;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!behindDetail) return;
    setExpanded(false);
    const hidden = hiddenTranslateY();
    if (behindDetailInstant) {
      setInstant(true);
      setTranslateY(hidden);
      requestAnimationFrame(() => setInstant(false));
    } else {
      setTranslateY(hidden);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behindDetail, behindDetailInstant]);

  useLayoutEffect(() => {
    if (!revealFromDetail) return;

    setExpanded(false);
    const hidden = hiddenTranslateY();
    setInstant(true);
    setTranslateY(hidden);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setInstant(false);
        setTranslateY(peekTopRef.current);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealFromDetail]);

  const updateDrag = (clientY: number, smoothVelocity = false) => {
    const next = clampTranslateY(
      computeDragTranslate(
        startTranslateRef.current,
        startYRef.current,
        clientY,
        getDragMinY(),
        getDragMaxY(),
      ),
    );
    setTranslateY(next);
    setExpanded(next <= getExpandedY() + SNAP_EPSILON);

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const inst = (clientY - lastYRef.current) / dt;
    velocityRef.current = smoothVelocity
      ? velocityRef.current * VELOCITY_SMOOTH_PREV + inst * VELOCITY_SMOOTH_INST
      : inst;
    lastYRef.current = clientY;
    lastTimeRef.current = now;
  };

  const cancelInertia = () => {
    if (!inertiaCancelRef.current) return;
    inertiaCancelRef.current();
    inertiaCancelRef.current = null;
    movingRef.current = false;
    setDragging(false);
  };

  const endDrag = () => {
    if (!movingRef.current) return;
    movingRef.current = false;
    setDragging(false);

    const peek = peekTopRef.current;
    const hidden = hiddenTranslateY();
    const current = clampTranslateY(translateRef.current);
    if (current !== translateRef.current) {
      setTranslateY(current);
    }
    const expandedY = getExpandedY();
    const mid = (expandedY + peek) / 2;
    const v = velocityRef.current;

    if (onDismissRef.current && !dismissingRef.current) {
      const dismissThreshold = peek + Math.min(48, (hidden - peek) * 0.15);
      if (
        (v > VELOCITY_SNAP && current >= peek - 20) ||
        current > dismissThreshold
      ) {
        dismissSheet();
        return;
      }
    }

    if (isInBrowseRange(current)) {
      setExpanded(false);
      return;
    }

    let target: number;
    if (v < -VELOCITY_SNAP) target = expandedY;
    else if (v > VELOCITY_SNAP) target = peek;
    else target = current < mid ? expandedY : peek;

    setTranslateY(clampTranslateY(target));
    setExpanded(isNearSnapPoint(target, expandedY));
  };

  const shouldSheetDrag = (dy: number) => {
    if (interactionDisabledRef.current) return false;
    return Math.abs(dy) >= MOVE_THRESHOLD;
  };

  const scheduleWheelEnd = () => {
    if (wheelEndTimerRef.current != null) {
      window.clearTimeout(wheelEndTimerRef.current);
    }
    wheelEndTimerRef.current = window.setTimeout(() => {
      wheelEndTimerRef.current = null;
      endDrag();
    }, WHEEL_END_MS);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null) return;
      const dy = y - startYRef.current;

      if (!movingRef.current) {
        if (!shouldSheetDrag(dy)) return;

        movingRef.current = true;
        setDragging(true);
        lastYRef.current = y;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }

      e.preventDefault();
      updateDrag(y, true);
    };

    const onWheel = (e: WheelEvent) => {
      if (
        interactionDisabledRef.current ||
        dismissingRef.current ||
        enteringRef.current ||
        behindDetailRef.current
      ) {
        return;
      }

      e.preventDefault();

      if (!movingRef.current) {
        movingRef.current = true;
        setDragging(true);
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      velocityRef.current = e.deltaY / dt;
      lastTimeRef.current = now;

      const next = clampTranslateY(translateRef.current + e.deltaY);
      setTranslateY(next);
      setExpanded(next <= getExpandedY() + SNAP_EPSILON);
      scheduleWheelEnd();
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchmove', onTouchMove, { capture: true });
      el.removeEventListener('wheel', onWheel);
      if (wheelEndTimerRef.current != null) {
        window.clearTimeout(wheelEndTimerRef.current);
      }
      cancelInertia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    cancelInertia();
    startYRef.current = e.touches[0]?.clientY ?? 0;
    startTranslateRef.current = translateRef.current;
    movingRef.current = false;
  };

  const handleTouchEnd = () => {
    if (!movingRef.current) return;

    const v = velocityRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reducedMotion && Math.abs(v) >= MIN_FLING_VELOCITY) {
      movingRef.current = true;
      setDragging(true);
      inertiaCancelRef.current = runSheetInertia({
        getY: () => translateRef.current,
        setY: (y) => {
          const next = clampTranslateY(y);
          setTranslateY(next);
          setExpanded(next <= getExpandedY() + SNAP_EPSILON);
        },
        getMinY: getDragMinY,
        getMaxY: getDragMaxY,
        velocityPxPerMs: v,
        friction: INERTIA_FRICTION,
        onFrame: (frameV) => {
          velocityRef.current = frameV;
        },
        onComplete: () => {
          inertiaCancelRef.current = null;
          endDrag();
        },
      });
      return;
    }

    endDrag();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactionDisabledRef.current) return;
    startYRef.current = e.clientY;
    startTranslateRef.current = translateRef.current;
    movingRef.current = false;
    let committed = false;

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startYRef.current;
      if (!committed) {
        if (!shouldSheetDrag(dy)) return;
        committed = true;
        movingRef.current = true;
        setDragging(true);
        lastYRef.current = ev.clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }
      updateDrag(ev.clientY);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      endDrag();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleOpenDetail = useCallback(
    (pool: Pool) => {
      onSelectPool?.(pool);
    },
    [onSelectPool],
  );

  return (
    <section
      ref={sectionRef}
      className={`search-results-panel ${ready ? 'is-ready' : ''} ${
        expanded ? 'is-expanded' : ''
      } ${dragging ? 'is-dragging' : ''} ${
        interactionDisabled ? 'is-inert' : ''
      } ${revealFromDetail ? 'is-revealing' : ''} ${
        softSheet ? 'is-soft-sheet' : ''
      }`}
      style={{ transform: `translateY(${translateY}px)` }}
      aria-label={ariaLabel}
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={handleTouchEnd}
      onTouchCancelCapture={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={barRef}
        className="search-results-panel__peek-bar"
        onClick={() => !dragging && setExpanded(!expandedRef.current)}
        role="presentation"
      >
        <span className="search-results-panel__handle" aria-hidden />
        <header className="search-results-panel__header">
          <h2 className="search-results-panel__title">
            {titlePrefix}{' '}
            <span className="search-results-panel__count">{pools.length}</span>
            {countSuffix}
          </h2>
        </header>
      </div>

      <div ref={listRef} className="search-results-panel__list" role="list">
        {pools.length === 0 ? (
          reservePeekWhenEmpty ? (
            <div className="search-results-panel__empty-slot" role="listitem">
              <p className="search-results-panel__empty">{emptyMessage}</p>
            </div>
          ) : (
            <p className="search-results-panel__empty">{emptyMessage}</p>
          )
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <SearchResultItem
                pool={pool}
                selected={selectedKey === getPoolListKey(pool)}
                onSelect={handleOpenDetail}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
