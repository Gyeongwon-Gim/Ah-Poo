import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { computeDragTranslate } from '@/pages/Explore/hooks/useBottomSheet';
import { clamp } from '@/utils/clamp';
import { runSheetInertia } from '@/utils/sheetInertia';

const TOP = 50;
const FALLBACK_PEEK = 200;
const PEEK_BAR_PADDING_TOP = 10;
const HANDLE_MARGIN_BOTTOM = 8;
const COLLAPSED_SHELL_PAD = 4;
const MOVE_THRESHOLD = 3;
const VELOCITY_SNAP = 0.5;
const WHEEL_END_MS = 120;
const SNAP_EPSILON = 8;
const INERTIA_FRICTION = 0.92;
const MIN_FLING_VELOCITY = 0.25;
const VELOCITY_SMOOTH_PREV = 0.6;
const VELOCITY_SMOOTH_INST = 0.4;

const readCssVarPx = (varName: string) => {
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
};

const getContainerH = (el: HTMLElement | null) => {
  if (typeof document === 'undefined') return 800;
  const vv = window.visualViewport?.height;
  if (vv) return Math.round(vv);
  const home = el?.closest?.('.explore') ?? document.querySelector('.explore');
  return (home as HTMLElement | null)?.clientHeight ?? window.innerHeight;
};

export interface UseListSheetOptions {
  resetKey?: string | number;
  itemCount: number;
  reservePeekWhenEmpty?: boolean;
  behindDetail?: boolean;
  behindDetailInstant?: boolean;
  revealFromDetail?: boolean;
  interactionDisabled?: boolean;
  liftPeekForNav?: boolean;
  enterFromBottom?: boolean;
  softSheet?: boolean;
  collapseToHandle?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onDismissStart?: () => void;
  onDismiss?: () => void;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export const useListSheet = ({
  resetKey,
  itemCount,
  reservePeekWhenEmpty = false,
  behindDetail = false,
  behindDetailInstant = false,
  revealFromDetail = false,
  interactionDisabled = false,
  liftPeekForNav = false,
  enterFromBottom = false,
  softSheet = false,
  collapseToHandle = false,
  onExpandedChange,
  onCollapsedChange,
  onDismissStart,
  onDismiss,
  onTopChange,
  onDragChange,
}: UseListSheetOptions) => {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const behindDetailRef = useRef(behindDetail);
  const revealFromDetailRef = useRef(revealFromDetail);
  const interactionDisabledRef = useRef(interactionDisabled);

  behindDetailRef.current = behindDetail;
  revealFromDetailRef.current = revealFromDetail;
  interactionDisabledRef.current = interactionDisabled;

  const [peekTop, setPeekTop] = useState(
    () => getContainerH(null) - FALLBACK_PEEK,
  );
  const [collapsedTop, setCollapsedTop] = useState(
    () => getContainerH(null) - 32,
  );
  const [translateY, setTranslateYState] = useState(() =>
    enterFromBottom ? getContainerH(null) : getContainerH(null) - FALLBACK_PEEK,
  );
  const [expanded, setExpandedState] = useState(false);
  const [collapsed, setCollapsedState] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [instant, setInstantState] = useState(false);

  const translateRef = useRef(translateY);
  const peekTopRef = useRef(peekTop);
  const collapsedTopRef = useRef(collapsedTop);
  const expandedRef = useRef(expanded);
  const collapsedRef = useRef(collapsed);
  const collapseToHandleRef = useRef(collapseToHandle);
  const onCollapsedChangeRef = useRef(onCollapsedChange);
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
  onCollapsedChangeRef.current = onCollapsedChange;
  peekTopRef.current = peekTop;
  collapsedTopRef.current = collapsedTop;
  collapseToHandleRef.current = collapseToHandle;
  collapsedRef.current = collapsed;

  const setTranslateY = (v: number) => {
    translateRef.current = v;
    setTranslateYState(v);
    onTopChangeRef.current?.(v);
  };

  const setInstant = (value: boolean) => {
    setInstantState(value);
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
    return canBrowseContent()
      ? Math.min(TOP, getContentBottomY())
      : getExpandedY();
  };

  const getDragMaxY = () => {
    if (collapseToHandleRef.current) return collapsedTopRef.current;
    if (onDismissRef.current) return hiddenTranslateY();
    return peekTopRef.current;
  };

  const measureHandleStripH = () => {
    const handleH = handleRef.current?.offsetHeight ?? 4;
    return (
      PEEK_BAR_PADDING_TOP + handleH + HANDLE_MARGIN_BOTTOM + COLLAPSED_SHELL_PAD
    );
  };

  const setCollapsed = (v: boolean) => {
    if (collapsedRef.current === v) return;
    collapsedRef.current = v;
    setCollapsedState(v);
    onCollapsedChangeRef.current?.(v);
  };

  const snapToCollapsed = () => {
    setExpanded(false);
    setCollapsed(true);
    setTranslateY(clampTranslateY(collapsedTopRef.current));
  };

  const expandFromCollapsed = useCallback(() => {
    if (!collapsedRef.current) return;
    setCollapsed(false);
    setExpanded(false);
    setTranslateY(clampTranslateY(peekTopRef.current));
  }, []);

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
    const collapsed = collapsedTopRef.current;
    if (
      isNearSnapPoint(current, expandedY) ||
      isNearSnapPoint(current, peek) ||
      (collapseToHandleRef.current && isNearSnapPoint(current, collapsed))
    ) {
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

  const toggleExpanded = () => {
    if (dragging) return;
    if (collapsedRef.current) {
      expandFromCollapsed();
      return;
    }
    setExpanded(!expandedRef.current);
  };

  const toggleHandle = () => {
    if (dragging) return;
    if (collapsedRef.current) {
      expandFromCollapsed();
      return;
    }
    if (expandedRef.current) {
      setExpanded(false);
      return;
    }
    if (collapseToHandleRef.current) {
      snapToCollapsed();
      return;
    }
    setExpanded(true);
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
    const barH = headerRef.current?.offsetHeight ?? 60;
    const firstItemEl = listRef.current?.firstElementChild;
    const useFirstSlot =
      itemCount > 0 || (reservePeekWhenEmpty && itemCount === 0);
    const firstItemH =
      useFirstSlot && firstItemEl instanceof HTMLElement
        ? firstItemEl.offsetHeight
        : 0;
    const navLift = liftPeekForNav ? readCssVarPx('--sheet-bottom-reserve') : 0;
    const peekVisibleH = barH + firstItemH + navLift;
    const next = Math.round(getContainerH(sectionRef.current) - peekVisibleH);
    peekTopRef.current = next;
    setPeekTop(next);

    if (collapseToHandleRef.current) {
      const handleStripH = measureHandleStripH();
      const nextCollapsed = Math.round(
        getContainerH(sectionRef.current) - handleStripH - navLift,
      );
      collapsedTopRef.current = nextCollapsed;
      setCollapsedTop(nextCollapsed);
    }

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
      const atCollapsed =
        collapseToHandleRef.current &&
        Math.abs(current - collapsedTopRef.current) < 2;
      if (atPeek) {
        setCollapsed(false);
        setTranslateY(peek);
      } else if (atCollapsed) {
        setCollapsed(true);
        setTranslateY(collapsedTopRef.current);
      }
    }
  };

  useLayoutEffect(() => {
    measurePeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, reservePeekWhenEmpty]);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const handle = handleRef.current;
    const firstItem = listRef.current?.firstElementChild;
    if (!section && !header && !handle && !firstItem) return undefined;

    const ro = new ResizeObserver(() => measurePeek());
    if (section) ro.observe(section);
    if (header) ro.observe(header);
    if (handle) ro.observe(handle);
    if (firstItem) ro.observe(firstItem);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, collapseToHandle]);

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
    setCollapsed(false);
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
      enteringRef.current ||
      collapsedRef.current
    ) {
      return;
    }

    const toggled = prevExpandedRef.current !== expanded;
    prevExpandedRef.current = expanded;

    if (expanded) {
      setCollapsed(false);
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
    setCollapsed(false);
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
    if (collapseToHandleRef.current && next < collapsedTopRef.current - SNAP_EPSILON) {
      setCollapsed(false);
    }

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
    const collapsedY = collapsedTopRef.current;
    const current = clampTranslateY(translateRef.current);
    if (current !== translateRef.current) {
      setTranslateY(current);
    }
    const expandedY = getExpandedY();
    const v = velocityRef.current;

    if (collapseToHandleRef.current && !dismissingRef.current) {
      const collapseThreshold = peek + (collapsedY - peek) * 0.45;
      if (
        (v > VELOCITY_SNAP && current >= peek - 20) ||
        current > collapseThreshold
      ) {
        snapToCollapsed();
        return;
      }

      if (isInBrowseRange(current)) {
        setExpanded(false);
        return;
      }

      let target: number;
      if (v < -VELOCITY_SNAP) {
        target =
          current < (expandedY + peek) / 2
            ? expandedY
            : collapsedRef.current
              ? collapsedY
              : peek;
      } else if (v > VELOCITY_SNAP) {
        target = current > (peek + collapsedY) / 2 ? collapsedY : peek;
      } else {
        const points = [expandedY, peek, collapsedY];
        target = points.reduce((nearest, point) =>
          Math.abs(current - point) < Math.abs(current - nearest) ? point : nearest,
        );
      }

      setTranslateY(clampTranslateY(target));
      setExpanded(isNearSnapPoint(target, expandedY));
      setCollapsed(isNearSnapPoint(target, collapsedY));
      return;
    }

    const mid = (expandedY + peek) / 2;

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

    el.addEventListener('touchmove', onTouchMove, {
      passive: false,
      capture: true,
    });
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

  const handleTouchStart = (e: ReactTouchEvent) => {
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

  const handleMouseDown = (e: ReactMouseEvent) => {
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

  return {
    sectionRef,
    listRef,
    headerRef,
    handleRef,
    ready,
    expanded,
    collapsed,
    dragging,
    instant,
    translateY,
    softSheet,
    revealing: revealFromDetail,
    inert: interactionDisabled,
    toggleExpanded,
    toggleHandle,
    expandFromCollapsed,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
  };
};
