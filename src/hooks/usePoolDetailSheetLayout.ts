import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
} from 'react';
import { useBottomSheet } from './useBottomSheet';
import {
  usePoolDetailSheetExpand,
  type PoolDetailExpandState,
} from './usePoolDetailSheetExpand';
import {
  applyThemeColor,
  getSheetThemeColor,
  restoreDefaultThemeColor,
} from '@/utils/themeColor';
import type { Pool } from '@/types/pool';
import type { ExpandPhase } from '@/pages/Home/components/PoolDetailSheet';
import {
  SHEET_CLOSE_MS,
  SHEET_CLOSE_THRESHOLD,
  SHEET_ENTER_MS,
  getScreenHeight,
} from '@/pages/Home/components/PoolDetailSheet';

export interface UsePoolDetailSheetLayoutParams {
  pool: Pool;
  instantEnter?: boolean;
  poolImageUrl: string | null;
  onClose: () => void;
  onCloseStart?: () => void;
  onBack?: () => void;
  onBackStart?: () => void;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export function usePoolDetailSheetLayout({
  pool,
  instantEnter = false,
  poolImageUrl,
  onClose,
  onCloseStart,
  onBack,
  onBackStart,
  onTopChange,
  onDragChange,
}: UsePoolDetailSheetLayoutParams) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const contentEssentialRef = useRef<HTMLDivElement>(null);
  const peekBodyRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef(0);
  const translateLockedRef = useRef(false);
  const anchorHeightRef = useRef(0);
  const anchorTranslateRef = useRef(0);
  const isFullscreenRef = useRef(false);
  const expandPhaseRef = useRef<ExpandPhase>('idle');
  const snapTransitionTimerRef = useRef<number | undefined>(undefined);
  const onTopChangeRef = useRef(onTopChange);
  const handleCloseRef = useRef<() => void>(() => {});
  const snapToPeekWithTransitionRef = useRef<() => void>(() => {});

  const [sheetH, setSheetH] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'interactive' | 'exiting'>(
    'entering',
  );
  const [snapTransition, setSnapTransition] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>('idle');
  const [expandDragging, setExpandDragging] = useState(false);
  const [headerDragging, setHeaderDragging] = useState(false);

  const expandState: PoolDetailExpandState = {
    isFullscreen,
    setIsFullscreen,
    isFullscreenRef,
    expandPhase,
    setExpandPhase,
    expandPhaseRef,
    expandDragging,
    setExpandDragging,
    headerDragging,
    setHeaderDragging,
  };

  useEffect(() => {
    expandPhaseRef.current = expandPhase;
  }, [expandPhase]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const snapPoints = useMemo(
    () => ({
      full: 0,
      peek: Math.max(0, sheetH - peekRef.current),
    }),
    [sheetH],
  );

  const { translate, setTranslate, translateRef, dragging, snapToPeek } =
    useBottomSheet({
      maxTranslate: sheetH,
      snapPoints,
      closeThreshold: SHEET_CLOSE_THRESHOLD,
      enabled:
        phase === 'interactive' && !isFullscreen && expandPhase === 'idle',
      onDragChange,
      onAfterDrag: ({ visible }) => {
        if (visible < SHEET_CLOSE_THRESHOLD) {
          handleCloseRef.current();
          return;
        }
        if (!isFullscreenRef.current) {
          snapToPeekWithTransitionRef.current();
        }
      },
    });

  const captureAnchor = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      anchorHeightRef.current = el.offsetHeight;
      anchorTranslateRef.current = translateRef.current;
    },
    [translateRef],
  );

  const applyLockedLayout = useCallback(
    (el: HTMLElement, h: number) => {
      if (isFullscreenRef.current) {
        translateRef.current = 0;
        el.style.transform = 'translateX(-50%)';
        return;
      }
      const nextTranslate =
        anchorTranslateRef.current + (h - anchorHeightRef.current);
      translateRef.current = nextTranslate;
      el.style.transform = `translate(-50%, ${nextTranslate}px)`;
    },
    [translateRef],
  );

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

  const snapToPeekWithTransition = useCallback(() => {
    if (isFullscreenRef.current) return;

    setSnapTransition(true);
    if (snapTransitionTimerRef.current) {
      window.clearTimeout(snapTransitionTimerRef.current);
    }
    snapTransitionTimerRef.current = window.setTimeout(() => {
      setSnapTransition(false);
      snapTransitionTimerRef.current = undefined;
    }, SHEET_CLOSE_MS);
    snapToPeek();
    if (translateLockedRef.current) {
      captureAnchor(sheetRef.current);
    }
  }, [captureAnchor, snapToPeek]);

  snapToPeekWithTransitionRef.current = snapToPeekWithTransition;

  const {
    resetExpandInstant,
    resetFullscreen,
    handleExpandTransitionEnd,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
    onPeekBodyPointerDown,
    onPeekBodyPointerMove,
    onPeekBodyPointerUp,
    onPeekBodyPointerCancel,
  } = usePoolDetailSheetExpand({
    sheetRef,
    peekRef,
    translateRef,
    setTranslate,
    setSheetH,
    snapPoints,
    sheetH,
    onDragChange,
    handleCloseRef,
    snapToPeekWithTransitionRef,
    clearExpandStyles,
    applyFullscreenTransform,
    expandState,
  });

  const runDismiss = useCallback(
    (start?: () => void, done?: () => void) => {
      if (expandPhaseRef.current !== 'idle') {
        resetExpandInstant();
      }
      start?.();
      const h = sheetRef.current?.offsetHeight ?? sheetH;
      setPhase('exiting');
      setTranslate(h);
      window.setTimeout(() => done?.(), SHEET_CLOSE_MS);
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
    const useSheetTheme = isFullscreen && phase !== 'exiting';
    if (useSheetTheme) {
      applyThemeColor(getSheetThemeColor());
    } else {
      restoreDefaultThemeColor();
    }
    return () => restoreDefaultThemeColor();
  }, [isFullscreen, phase]);

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

    resetFullscreen();
    expandPhaseRef.current = 'idle';
    setExpandPhase('idle');
    setExpandDragging(false);
    setHeaderDragging(false);
    translateLockedRef.current = false;
    clearExpandStyles(el);

    const measureGrabberPadding = () => {
      const grabberStyles = getComputedStyle(grab);
      return (
        (parseFloat(grabberStyles.paddingTop) || 0) +
        (parseFloat(grabberStyles.paddingBottom) || 0)
      );
    };

    const measurePeekHeight = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const toolbarH = toolbarRef.current?.offsetHeight ?? 0;
      const essentialH = contentEssentialRef.current?.offsetHeight ?? 0;
      return Math.round(
        headerH + toolbarH + essentialH + measureGrabberPadding(),
      );
    };

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

      const peekH = measurePeekHeight();
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
          }, SHEET_ENTER_MS + 80);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    if (headerRef.current) resizeObserver?.observe(headerRef.current);
    if (toolbarRef.current) resizeObserver?.observe(toolbarRef.current);
    if (contentEssentialRef.current) {
      resizeObserver?.observe(contentEssentialRef.current);
    }

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
    resetFullscreen,
    translateRef,
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
  }, [
    isFullscreen,
    applyFullscreenTransform,
    setTranslate,
    reportTop,
    translateRef,
  ]);

  const handleEnterEnd = useCallback(
    (e: ReactAnimationEvent) => {
      if (e.target !== sheetRef.current) return;
      if (e.animationName !== 'pool-sheet-enter') return;
      setPhase('interactive');
      translateLockedRef.current = true;
      captureAnchor(sheetRef.current);
    },
    [captureAnchor],
  );

  return {
    sheetRef,
    grabberRef,
    headerRef,
    toolbarRef,
    contentEssentialRef,
    peekBodyRef,
    translateRef,
    dragging,
    phase,
    snapTransition,
    isFullscreen,
    expandPhase,
    expandDragging,
    headerDragging,
    handleBack,
    handleClose,
    handleEnterEnd,
    handleExpandTransitionEnd,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp,
    onHeaderPointerCancel,
    onPeekBodyPointerDown,
    onPeekBodyPointerMove,
    onPeekBodyPointerUp,
    onPeekBodyPointerCancel,
  };
}
