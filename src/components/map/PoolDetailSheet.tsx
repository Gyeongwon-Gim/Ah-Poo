import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Star,
  X,
  ChevronLeft,
  Navigation,
  Share2,
  Home,
  Copy,
  Phone,
  Waves,
} from 'lucide-react';
import { formatDailyAdmissionFee } from '../../utils/formatFee';
import { formatDistanceKmLabel } from '../../utils/formatDistance';
import { openNaverDirections } from '../../utils/naverDirectionsUrl';
import { useBottomSheet, computeDragTranslate } from '../../hooks/useBottomSheet';
import { usePoolImageUrl } from '../../hooks/usePoolImageUrl';
import { useFavorites } from '../../hooks/useFavorites';
import { isFlagOn } from '../../services/pools';
import { clamp } from '../../utils/clamp';
import {
  applyThemeColor,
  getSheetThemeColor,
  restoreDefaultThemeColor,
} from '../../utils/themeColor';
import {
  fetchMorePoolBlogReviews,
  fetchPoolBlogReviewsForPool,
  formatPostDate,
  type PoolBlogReviewItem,
} from '../../services/naverBlog';
import type { GeoCoords } from '../../hooks/useUserLocation';
import type { Pool } from '../../types/pool';
import './PoolDetailSheet.css';

const CLOSE_THRESHOLD = 96;
const ENTER_MS = 340;
const CLOSE_MS = ENTER_MS;
const BLOG_INITIAL_VISIBLE = 3;
const BLOG_LOAD_MORE_STEP = 3;
const SWIPE_MAX_HORIZONTAL = 24;
const GESTURE_LOCK_PX = 8;
const EXPAND_COMMIT_THRESHOLD = 0.25;

type ExpandPhase = 'idle' | 'dragging' | 'animating';

interface PeekBarGesture {
  startX: number;
  startY: number;
  mode: 'undecided' | 'expand' | 'dismiss';
  pointerId: number;
  dismissStartTranslate?: number;
}

interface PeekBodyGesture {
  startX: number;
  startY: number;
  pointerId: number;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getScreenHeight() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--screen-h')
    .trim();
  const px = Number.parseFloat(raw);
  if (raw.endsWith('px') && Number.isFinite(px) && px > 0) {
    return px;
  }
  return getViewportHeight();
}

interface PoolDetailSheetProps {
  pool: Pool;
  userLocation?: GeoCoords | null;
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
  userLocation = null,
  onClose,
  onCloseStart,
  onBack,
  onBackStart,
  instantEnter = false,
  onTopChange,
  onDragChange,
}: PoolDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const peekPreviewRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef(0);
  const translateLockedRef = useRef(false);
  const anchorHeightRef = useRef(0);
  const anchorTranslateRef = useRef(0);
  const isFullscreenRef = useRef(false);
  const expandPhaseRef = useRef<ExpandPhase>('idle');
  const expandProgressRef = useRef(0);
  const expandStartHRef = useRef(0);
  const peekBarGestureRef = useRef<PeekBarGesture | null>(null);
  const peekBodyGestureRef = useRef<PeekBodyGesture | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'interactive' | 'exiting'>(
    'entering',
  );
  const [snapTransition, setSnapTransition] = useState(false);
  const snapTransitionTimerRef = useRef<number | undefined>(undefined);
  const onTopChangeRef = useRef(onTopChange);
  const handleCloseRef = useRef<() => void>(() => {});
  const snapToPeekWithTransitionRef = useRef<() => void>(() => {});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>('idle');
  const [expandDragging, setExpandDragging] = useState(false);
  const [peekBarDragging, setPeekBarDragging] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const [blogReviews, setBlogReviews] = useState<PoolBlogReviewItem[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogQuery, setBlogQuery] = useState('');
  const [blogNextStart, setBlogNextStart] = useState(1);
  const [visibleBlogCount, setVisibleBlogCount] = useState(BLOG_INITIAL_VISIBLE);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogLoadMoreLoading, setBlogLoadMoreLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogThumbFailed, setBlogThumbFailed] = useState<Set<string>>(
    () => new Set(),
  );
  const [blogRetryKey, setBlogRetryKey] = useState(0);
  const { poolImageUrl, poolImageFailed, markPoolImageFailed } =
    usePoolImageUrl(pool.id);

  const snapPoints = useMemo(
    () => ({
      full: 0,
      peek: Math.max(0, sheetH - peekRef.current),
    }),
    [sheetH],
  );

  const {
    translate,
    setTranslate,
    translateRef,
    dragging,
    snapToPeek,
  } = useBottomSheet({
    maxTranslate: sheetH,
    snapPoints,
    closeThreshold: CLOSE_THRESHOLD,
    enabled:
      phase === 'interactive' &&
      !isFullscreen &&
      expandPhase === 'idle',
    onDragChange,
    onAfterDrag: ({ visible }) => {
      if (visible < CLOSE_THRESHOLD) {
        handleCloseRef.current();
        return;
      }
      if (!isFullscreenRef.current) {
        snapToPeekWithTransitionRef.current();
      }
    },
  });

  const captureAnchor = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    anchorHeightRef.current = el.offsetHeight;
    anchorTranslateRef.current = translateRef.current;
  }, [translateRef]);

  const applyLockedLayout = useCallback((el: HTMLElement, h: number) => {
    if (isFullscreenRef.current) {
      translateRef.current = 0;
      el.style.transform = 'translateX(-50%)';
      return;
    }
    const nextTranslate =
      anchorTranslateRef.current + (h - anchorHeightRef.current);
    translateRef.current = nextTranslate;
    el.style.transform = `translate(-50%, ${nextTranslate}px)`;
  }, [translateRef]);

  const applyFullscreenTransform = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      translateRef.current = 0;
      el.style.transform = 'translateX(-50%)';
    },
    [translateRef],
  );

  const clearExpandStyles = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    el.style.removeProperty('--expand-h');
    el.style.removeProperty('height');
    el.style.removeProperty('border-radius');
  }, []);

  const commitFullscreen = useCallback(() => {
    if (isFullscreenRef.current) return;

    isFullscreenRef.current = true;
    setIsFullscreen(true);
    expandPhaseRef.current = 'idle';
    setExpandPhase('idle');
    setExpandDragging(false);
    expandProgressRef.current = 0;

    const screenH = getScreenHeight();
    setSheetH(screenH);
    peekRef.current = screenH;
    translateRef.current = 0;
    setTranslate(0);

    const el = sheetRef.current;
    clearExpandStyles(el);
    el?.style.setProperty('--peek-h', `${screenH}px`);
    applyFullscreenTransform(el);
  }, [applyFullscreenTransform, clearExpandStyles, setTranslate]);

  const updateExpandProgress = useCallback(
    (progress: number, { dragging }: { dragging: boolean }) => {
      const peekH = expandStartHRef.current || peekRef.current;
      const screenH = getScreenHeight();
      const range = Math.max(0, screenH - peekH);
      const clamped = clamp(progress, 0, 1);
      const h = peekH + range * clamped;
      const el = sheetRef.current;
      if (!el) return;

      expandProgressRef.current = clamped;
      el.style.setProperty('--expand-h', `${h}px`);
      if (clamped > 0 && clamped < 1) {
        el.style.borderRadius = `${Math.round(
          (1 - clamped) * 16,
        )}px ${Math.round((1 - clamped) * 16)}px 0 0`;
      } else if (clamped >= 1) {
        el.style.borderRadius = '0';
      } else {
        el.style.borderRadius = '';
      }

      if (clamped > 0 && expandPhaseRef.current === 'idle') {
        expandPhaseRef.current = dragging ? 'dragging' : 'animating';
        setExpandPhase(expandPhaseRef.current);
      }
      setExpandDragging(dragging);
    },
    [],
  );

  const cancelExpand = useCallback(() => {
    if (expandPhaseRef.current === 'idle') return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const el = sheetRef.current;
    const peekH = expandStartHRef.current || peekRef.current;

    if (reducedMotion) {
      expandPhaseRef.current = 'idle';
      setExpandPhase('idle');
      setExpandDragging(false);
      expandProgressRef.current = 0;
      clearExpandStyles(el);
      return;
    }

    expandProgressRef.current = 0;
    expandPhaseRef.current = 'animating';
    setExpandPhase('animating');
    setExpandDragging(false);
    el?.style.setProperty('--expand-h', `${peekH}px`);
    el?.style.removeProperty('border-radius');
  }, [clearExpandStyles]);

  const beginExpandAnimation = useCallback(() => {
    if (isFullscreenRef.current || expandPhaseRef.current !== 'idle') return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion) {
      commitFullscreen();
      return;
    }

    const peekH = peekRef.current;
    expandStartHRef.current = peekH;
    const screenH = getScreenHeight();
    const el = sheetRef.current;
    if (!el) return;

    expandProgressRef.current = 0;
    expandPhaseRef.current = 'animating';
    setExpandPhase('animating');
    setExpandDragging(false);
    el.style.setProperty('--expand-h', `${peekH}px`);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        expandProgressRef.current = 1;
        el.style.setProperty('--expand-h', `${screenH}px`);
        el.style.borderRadius = '0';
      });
    });
  }, [commitFullscreen]);

  const finishExpandDrag = useCallback(
    (progress: number) => {
      if (progress >= EXPAND_COMMIT_THRESHOLD) {
        if (progress >= 1) {
          commitFullscreen();
          return;
        }
        const screenH = getScreenHeight();
        expandPhaseRef.current = 'animating';
        setExpandPhase('animating');
        setExpandDragging(false);
        expandProgressRef.current = 1;
        sheetRef.current?.style.setProperty('--expand-h', `${screenH}px`);
        sheetRef.current?.style.setProperty('border-radius', '0');
        return;
      }
      cancelExpand();
    },
    [cancelExpand, commitFullscreen],
  );

  const resetExpandInstant = useCallback(() => {
    expandPhaseRef.current = 'idle';
    setExpandPhase('idle');
    setExpandDragging(false);
    setPeekBarDragging(false);
    clearExpandStyles(sheetRef.current);
  }, [clearExpandStyles]);

  const snapToPeekWithTransition = useCallback(() => {
    if (isFullscreenRef.current) return;

    setSnapTransition(true);
    if (snapTransitionTimerRef.current) {
      window.clearTimeout(snapTransitionTimerRef.current);
    }
    snapTransitionTimerRef.current = window.setTimeout(() => {
      setSnapTransition(false);
      snapTransitionTimerRef.current = undefined;
    }, CLOSE_MS);
    snapToPeek();
    if (translateLockedRef.current) {
      captureAnchor(sheetRef.current);
    }
  }, [captureAnchor, snapToPeek]);

  snapToPeekWithTransitionRef.current = snapToPeekWithTransition;

  const runDismiss = useCallback(
    (start?: () => void, done?: () => void) => {
      if (expandPhaseRef.current !== 'idle') {
        resetExpandInstant();
      }
      start?.();
      const h = sheetRef.current?.offsetHeight ?? sheetH;
      setPhase('exiting');
      setTranslate(h);
      window.setTimeout(() => done?.(), CLOSE_MS);
    },
    [resetExpandInstant, sheetH, setTranslate],
  );

  const handleBack = useCallback(() => {
    runDismiss(onBackStart, onBack ?? onClose);
  }, [runDismiss, onBackStart, onBack, onClose]);

  const handleClose = useCallback(() => {
    runDismiss(onCloseStart, onClose);
  }, [runDismiss, onCloseStart, onClose]);

  handleCloseRef.current = handleClose;

  useEffect(() => {
    expandPhaseRef.current = expandPhase;
  }, [expandPhase]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    const useSheetTheme = isFullscreen && phase !== 'exiting';
    if (useSheetTheme) {
      applyThemeColor(getSheetThemeColor());
    } else {
      restoreDefaultThemeColor();
    }
    return () => restoreDefaultThemeColor();
  }, [isFullscreen, phase]);

  useEffect(() => {
    if (!pool) return undefined;

    const controller = new AbortController();
    setBlogReviews([]);
    setBlogTotal(0);
    setBlogQuery('');
    setBlogNextStart(1);
    setVisibleBlogCount(BLOG_INITIAL_VISIBLE);
    setBlogError(null);
    setBlogThumbFailed(new Set());
    setBlogLoading(true);

    fetchPoolBlogReviewsForPool(pool, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setBlogReviews(result.items);
        setBlogTotal(result.total);
        setBlogQuery(result.query);
        setBlogNextStart(1 + result.fetchedCount);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setBlogError(
          err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        setBlogLoading(false);
      });

    return () => controller.abort();
  }, [pool, blogRetryKey]);

  const appendBlogReviews = useCallback((items: PoolBlogReviewItem[]) => {
    if (!items.length) return;
    setBlogReviews((prev) => {
      const seen = new Set(prev.map((item) => item.link));
      const next = [...prev];
      for (const item of items) {
        if (!seen.has(item.link)) {
          seen.add(item.link);
          next.push(item);
        }
      }
      return next;
    });
  }, []);

  const handleLoadMoreBlog = useCallback(async () => {
    if (blogLoadMoreLoading) return;

    if (visibleBlogCount < blogReviews.length) {
      setVisibleBlogCount((count) => count + BLOG_LOAD_MORE_STEP);
      return;
    }

    if (!blogQuery || blogNextStart > blogTotal) return;

    setBlogLoadMoreLoading(true);
    try {
      const result = await fetchMorePoolBlogReviews(pool, {
        query: blogQuery,
        start: blogNextStart,
        display: 10,
      });
      appendBlogReviews(result.items);
      setBlogTotal(result.total);
      setBlogNextStart(blogNextStart + result.fetchedCount);
      setVisibleBlogCount((count) => count + BLOG_LOAD_MORE_STEP);
    } catch (err) {
      setBlogError(
        err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.',
      );
    } finally {
      setBlogLoadMoreLoading(false);
    }
  }, [
    appendBlogReviews,
    blogLoadMoreLoading,
    blogNextStart,
    blogQuery,
    blogReviews.length,
    blogTotal,
    pool,
    visibleBlogCount,
  ]);

  const visibleBlogReviews = blogReviews.slice(0, visibleBlogCount);
  const canLoadMoreBlog =
    visibleBlogCount < blogReviews.length ||
    blogReviews.length < blogTotal ||
    blogNextStart <= blogTotal;

  useEffect(
    () => () => {
      if (snapTransitionTimerRef.current) {
        window.clearTimeout(snapTransitionTimerRef.current);
      }
    },
    [],
  );

  onTopChangeRef.current = onTopChange;

  const reportTop = useCallback(() => {
    const el = sheetRef.current;
    if (!el || !onTopChangeRef.current) return;
    onTopChangeRef.current(el.getBoundingClientRect().top);
  }, []);

  useEffect(() => {
    reportTop();
  }, [translate, phase, reportTop, isFullscreen, expandPhase, expandDragging]);

  useEffect(() => {
    if (phase !== 'entering' || !onTopChangeRef.current) return undefined;

    let raf = 0;
    const tick = () => {
      reportTop();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reportTop]);

  useEffect(() => {
    if (!onTopChangeRef.current) return undefined;
    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => reportTop());
    ro.observe(el);
    return () => ro.disconnect();
  }, [pool, reportTop]);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    const grab = grabberRef.current;
    if (!el || !grab) return;

    setIsFullscreen(false);
    isFullscreenRef.current = false;
    expandPhaseRef.current = 'idle';
    setExpandPhase('idle');
    setExpandDragging(false);
    setPeekBarDragging(false);
    translateLockedRef.current = false;
    clearExpandStyles(el);

    const measure = () => {
      if (expandPhaseRef.current !== 'idle') return;

      if (isFullscreenRef.current) {
        const screenH = getScreenHeight();
        setSheetH(screenH);
        peekRef.current = screenH;
        el.style.setProperty('--peek-h', `${screenH}px`);

        if (!translateLockedRef.current) {
          translateRef.current = 0;
          setTranslate(0);
          applyFullscreenTransform(el);
        } else {
          applyLockedLayout(el, screenH);
        }
        return;
      }

      const peekH = grab.offsetHeight;
      setSheetH(peekH);
      peekRef.current = peekH;
      el.style.setProperty('--peek-h', `${peekH}px`);

      if (!translateLockedRef.current) {
        setTranslate(0);
      } else {
        applyLockedLayout(el, peekH);
      }
    };

    measure();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (instantEnter || reducedMotion) {
      setPhase('interactive');
      translateLockedRef.current = true;
      captureAnchor(el);
    } else {
      setPhase('entering');
    }

    const fallback =
      instantEnter || reducedMotion
        ? undefined
        : window.setTimeout(() => {
            setPhase('interactive');
            translateLockedRef.current = true;
            captureAnchor(el);
          }, ENTER_MS + 80);

    const observeTarget = peekPreviewRef.current ?? grab;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    resizeObserver?.observe(observeTarget);

    const onScreenResize = () => {
      translateLockedRef.current = false;
      measure();
      translateLockedRef.current = true;
      captureAnchor(el);
    };

    window.addEventListener('screen-resize', onScreenResize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('screen-resize', onScreenResize);
      if (fallback) window.clearTimeout(fallback);
    };
  }, [
    pool,
    instantEnter,
    applyLockedLayout,
    applyFullscreenTransform,
    captureAnchor,
    clearExpandStyles,
    setTranslate,
    poolImageUrl,
  ]);

  useLayoutEffect(() => {
    if (!isFullscreen) return;
    const el = sheetRef.current;
    if (!el) return;

    const screenH = getScreenHeight();
    setSheetH(screenH);
    peekRef.current = screenH;
    el.style.setProperty('--peek-h', `${screenH}px`);
    translateRef.current = 0;
    setTranslate(0);
    applyFullscreenTransform(el);
    reportTop();
  }, [isFullscreen, applyFullscreenTransform, setTranslate, reportTop]);

  const handleEnterEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== sheetRef.current) return;
      if (e.animationName !== 'pool-sheet-enter') return;
      setPhase('interactive');
      translateLockedRef.current = true;
      captureAnchor(sheetRef.current);
    },
    [captureAnchor],
  );

  const handleExpandTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== sheetRef.current) return;
      if (e.propertyName !== 'height') return;
      if (expandPhaseRef.current !== 'animating') return;

      if (expandProgressRef.current >= 1) {
        commitFullscreen();
        return;
      }

      if (expandProgressRef.current <= 0) {
        expandPhaseRef.current = 'idle';
        setExpandPhase('idle');
        clearExpandStyles(sheetRef.current);
      }
    },
    [clearExpandStyles, commitFullscreen],
  );

  const deltaYToExpandProgress = useCallback((deltaY: number) => {
    const peekH = expandStartHRef.current || peekRef.current;
    const screenH = getScreenHeight();
    const range = Math.max(0, screenH - peekH);
    if (range <= 0) return 1;
    return clamp(-deltaY / range, 0, 1);
  }, []);

  const onPeekBarPointerDown = (e: ReactPointerEvent) => {
    if (expandPhaseRef.current === 'animating') return;
    peekBarGestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      mode: 'undecided',
      pointerId: e.pointerId,
    };
  };

  const finishPeekBarDismissDrag = useCallback(() => {
    setPeekBarDragging(false);
    onDragChange?.(false);
    const visible = sheetH - translateRef.current;
    if (visible < CLOSE_THRESHOLD) {
      handleCloseRef.current();
      return;
    }
    snapToPeekWithTransitionRef.current();
  }, [onDragChange, sheetH, translateRef]);

  const onPeekBarPointerMove = (e: ReactPointerEvent) => {
    const gesture = peekBarGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    const deltaY = e.clientY - gesture.startY;
    const deltaX = e.clientX - gesture.startX;

    if (gesture.mode === 'undecided') {
      if (
        Math.abs(deltaX) > SWIPE_MAX_HORIZONTAL &&
        Math.abs(deltaY) < GESTURE_LOCK_PX
      ) {
        return;
      }
      if (Math.abs(deltaY) < GESTURE_LOCK_PX) return;

      if (deltaY < 0) {
        gesture.mode = 'expand';
        expandStartHRef.current = peekRef.current;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateExpandProgress(deltaYToExpandProgress(deltaY), {
          dragging: true,
        });
        return;
      }

      gesture.mode = 'dismiss';
      gesture.dismissStartTranslate = translateRef.current;
      setPeekBarDragging(true);
      onDragChange?.(true);
    }

    if (gesture.mode === 'expand') {
      updateExpandProgress(deltaYToExpandProgress(deltaY), { dragging: true });
      return;
    }

    setTranslate(
      computeDragTranslate(
        gesture.dismissStartTranslate ?? snapPoints.peek,
        gesture.startY,
        e.clientY,
        snapPoints.full,
        sheetH,
      ),
    );
  };

  const onPeekBarPointerUp = (e: ReactPointerEvent) => {
    const gesture = peekBarGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) {
      peekBarGestureRef.current = null;
      return;
    }

    if (gesture.mode === 'expand') {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      finishExpandDrag(expandProgressRef.current);
    } else if (gesture.mode === 'dismiss') {
      finishPeekBarDismissDrag();
    } else {
      const moved = Math.hypot(
        e.clientX - gesture.startX,
        e.clientY - gesture.startY,
      );
      if (
        moved < GESTURE_LOCK_PX &&
        (e.target as HTMLElement).closest('.pool-sheet__handle')
      ) {
        beginExpandAnimation();
      }
    }

    peekBarGestureRef.current = null;
  };

  const onPeekBarPointerCancel = (e: ReactPointerEvent) => {
    const gesture = peekBarGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    if (gesture.mode === 'expand') {
      finishExpandDrag(expandProgressRef.current);
    } else if (gesture.mode === 'dismiss') {
      finishPeekBarDismissDrag();
    }
    peekBarGestureRef.current = null;
  };

  const onPeekBodyPointerDown = (e: ReactPointerEvent) => {
    if (expandPhaseRef.current === 'animating') return;
    peekBodyGestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPeekBodyPointerMove = (e: ReactPointerEvent) => {
    const gesture = peekBodyGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    const deltaY = e.clientY - gesture.startY;
    const deltaX = e.clientX - gesture.startX;
    if (
      Math.abs(deltaX) > SWIPE_MAX_HORIZONTAL &&
      Math.abs(deltaY) < GESTURE_LOCK_PX
    ) {
      return;
    }
    if (deltaY >= 0 && expandPhaseRef.current === 'idle') return;

    if (Math.abs(deltaY) >= GESTURE_LOCK_PX || expandPhaseRef.current !== 'idle') {
      if (expandPhaseRef.current === 'idle') {
        expandStartHRef.current = peekRef.current;
      }
      updateExpandProgress(deltaYToExpandProgress(deltaY), { dragging: true });
    }
  };

  const onPeekBodyPointerUp = (e: ReactPointerEvent) => {
    const gesture = peekBodyGestureRef.current;
    peekBodyGestureRef.current = null;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (expandPhaseRef.current === 'dragging') {
      finishExpandDrag(expandProgressRef.current);
    }
  };

  const onPeekBodyPointerCancel = (e: ReactPointerEvent) => {
    const gesture = peekBodyGestureRef.current;
    peekBodyGestureRef.current = null;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    if (expandPhaseRef.current === 'dragging') {
      finishExpandDrag(expandProgressRef.current);
    }
  };

  if (!pool) return null;

  const distanceLabel =
    typeof pool.distanceKm === 'number'
      ? formatDistanceKmLabel(pool.distanceKm)
      : null;

  const handleDirections = () => {
    openNaverDirections(pool, {
      origin: userLocation
        ? { ...userLocation, name: '현재 위치' }
        : null,
    });
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

  const stop = (e: ReactPointerEvent | React.MouseEvent) =>
    e.stopPropagation();

  const renderToolbar = () => (
    <div className="pool-sheet__toolbar">
      <button
        type="button"
        className="pool-sheet__back"
        onClick={handleBack}
        onPointerDown={stop}
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={30} strokeWidth={1.5} aria-hidden />
      </button>
      <div className="pool-sheet__head-actions">
        <button
          type="button"
          className={`pool-sheet__round ${
            favorite ? 'pool-sheet__round--active' : ''
          }`}
          onClick={() => toggleFavorite(pool)}
          onPointerDown={stop}
          aria-label="즐겨찾기"
          aria-pressed={favorite}
        >
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="pool-sheet__round"
          onClick={handleClose}
          onPointerDown={stop}
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );

  const renderHero = () =>
    poolImageUrl && !poolImageFailed ? (
      <div className="pool-sheet__hero-wrap">
        <img
          className="pool-sheet__hero"
          src={poolImageUrl}
          alt=""
          loading="lazy"
          onError={markPoolImageFailed}
        />
      </div>
    ) : (
      <div
        className="pool-sheet__hero-wrap pool-sheet__hero-wrap--placeholder"
        aria-hidden
      >
        <Waves size={32} />
      </div>
    );

  const renderTitles = () => (
    <div className="pool-sheet__titles">
      <div className="pool-sheet__name-row">
        <h2 className="pool-sheet__name">{pool.name}</h2>
        {isFlagOn(pool.is50m) && (
          <span className="pool-sheet__tag pool-sheet__tag--50m">50m</span>
        )}
      </div>
      {pool.fee && (
        <p className="pool-sheet__meta">
          <span className="pool-sheet__meta-fee">
            {formatDailyAdmissionFee(pool.fee)}
          </span>
        </p>
      )}
    </div>
  );

  const renderLocation = () => (
    <div className="pool-sheet__location">
      {distanceLabel && (
        <span className="pool-sheet__distance" x-apple-data-detectors="none">
          {distanceLabel}
        </span>
      )}
      <span className="pool-sheet__address-wrap">
        <span className="pool-sheet__address" x-apple-data-detectors="none">
          {pool.roadAddress}
        </span>
        <button
          type="button"
          className="pool-sheet__copy-address"
          onClick={handleCopyAddress}
          onPointerDown={stop}
          aria-label="주소 복사"
        >
          <Copy size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </span>
    </div>
  );

  const renderPhone = () =>
    pool.phone ? (
      <div>
        <a
          className="pool-sheet__contact"
          href={`tel:${String(pool.phone).replace(/\s/g, '')}`}
        >
          <Phone
            size={16}
            strokeWidth={1.75}
            className="pool-sheet__contact-icon"
            aria-hidden
          />
          <span>{pool.phone}</span>
        </a>
      </div>
    ) : null;

  const renderActions = () => (
    <div className="pool-sheet__actions">
      {pool.official_url && (
        <a
          className="pool-sheet__action"
          href={pool.official_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Home size={18} />
          <span>홈페이지</span>
        </a>
      )}
      <button type="button" className="pool-sheet__action" onClick={handleShare}>
        <Share2 size={18} />
        <span>공유</span>
      </button>
      <button
        type="button"
        className="pool-sheet__action pool-sheet__action--primary"
        onClick={handleDirections}
      >
        <Navigation size={18} />
        <span>길찾기</span>
      </button>
    </div>
  );

  const renderBlog = () => (
    <section className="pool-sheet__blog" aria-live="polite">
      <h3 className="pool-sheet__blog-title">블로그 리뷰</h3>
      {blogLoading && (
        <p className="pool-sheet__blog-status">리뷰를 불러오는 중…</p>
      )}
      {!blogLoading && blogError && (
        <div className="pool-sheet__blog-error">
          <p className="pool-sheet__blog-status pool-sheet__blog-status--error">
            {blogError}
          </p>
          <button
            type="button"
            className="pool-sheet__blog-retry"
            onClick={() => setBlogRetryKey((key) => key + 1)}
          >
            다시 시도
          </button>
        </div>
      )}
      {!blogLoading && !blogError && visibleBlogReviews.length > 0 && (
        <div className="pool-sheet__blog-list">
          {visibleBlogReviews.map((review) => (
            <a
              key={review.link}
              className="pool-sheet__blog-card"
              href={review.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {review.thumbnailUrl && !blogThumbFailed.has(review.link) && (
                <img
                  className="pool-sheet__blog-thumb"
                  src={review.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setBlogThumbFailed((prev) => new Set(prev).add(review.link))
                  }
                />
              )}
              <span className="pool-sheet__blog-body">
                <span className="pool-sheet__blog-link">{review.title}</span>
                {review.description && (
                  <span className="pool-sheet__blog-desc">
                    {review.description}
                  </span>
                )}
                <span className="pool-sheet__blog-meta">
                  {review.bloggerName}
                  {review.postDate && (
                    <>
                      <span className="pool-sheet__blog-meta-dot">·</span>
                      {formatPostDate(review.postDate)}
                    </>
                  )}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
      {!blogLoading && !blogError && canLoadMoreBlog && blogReviews.length > 0 && (
        <button
          type="button"
          className="pool-sheet__blog-more"
          onClick={handleLoadMoreBlog}
          disabled={blogLoadMoreLoading}
        >
          {blogLoadMoreLoading ? '불러오는 중…' : '펼쳐서 더보기'}
        </button>
      )}
      {!blogLoading && !blogError && blogReviews.length === 0 && (
        <p className="pool-sheet__blog-status">관련 리뷰를 찾지 못했어요</p>
      )}
      <p className="pool-sheet__blog-attribution">검색 결과 제공: NAVER</p>
    </section>
  );

  return (
    <div
      ref={sheetRef}
      className={`pool-sheet ${
        phase === 'entering' ? 'pool-sheet--entering' : ''
      } ${
        (phase === 'exiting' || snapTransition) &&
          !dragging &&
          !expandDragging &&
          !peekBarDragging
          ? 'pool-sheet--transition'
          : ''
      } ${
        dragging || expandDragging || peekBarDragging
          ? 'pool-sheet--dragging'
          : ''
      } ${
        isFullscreen ? 'pool-sheet--fullscreen' : ''
      } ${expandPhase !== 'idle' ? 'pool-sheet--expanding' : ''} ${
        expandDragging ? 'pool-sheet--expand-dragging' : ''
      }`}
      style={
        phase === 'entering' && !isFullscreen
          ? undefined
          : isFullscreen
            ? { transform: 'translateX(-50%)' }
            : { transform: `translate(-50%, ${translateRef.current}px)` }
      }
      onAnimationEnd={handleEnterEnd}
      onTransitionEnd={handleExpandTransitionEnd}
      role="dialog"
      aria-label={`${pool.name} 상세`}
    >
      <div ref={grabberRef} className="pool-sheet__grabber">
        {isFullscreen ? (
          <>
            <div className="pool-sheet__modal-header">{renderToolbar()}</div>
            <div className="pool-sheet__scroll-outer">
              <div className="pool-sheet__scroll-inner">
                <div className="pool-sheet__head">
                  {renderHero()}
                  {renderTitles()}
                </div>
                {renderLocation()}
                {renderPhone()}
                {renderActions()}
                {renderBlog()}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="pool-sheet__peek-bar"
              onPointerDown={onPeekBarPointerDown}
              onPointerMove={onPeekBarPointerMove}
              onPointerUp={onPeekBarPointerUp}
              onPointerCancel={onPeekBarPointerCancel}
            >
              <button
                type="button"
                className="pool-sheet__handle"
                aria-label="전체 보기"
              />
            </div>
            <div
              ref={peekPreviewRef}
              className="pool-sheet__peek-body"
              onPointerDown={onPeekBodyPointerDown}
              onPointerMove={onPeekBodyPointerMove}
              onPointerUp={onPeekBodyPointerUp}
              onPointerCancel={onPeekBodyPointerCancel}
            >
              {renderToolbar()}
              <div className="pool-sheet__head">
                {renderHero()}
                {renderTitles()}
              </div>
              {renderLocation()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
