import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
} from 'react';
import { useBottomSheet } from '@/pages/Explore/hooks/useBottomSheet';
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
import {
  SHEET_CLOSE_MS,
  SHEET_CLOSE_THRESHOLD,
  SHEET_ENTER_MS,
  getScreenHeight,
  type ExpandPhase,
} from '../constants';

export interface UsePoolDetailSheetLayoutParams {
  pool: Pool;
  instantEnter?: boolean;
  onClose: () => void;
  onCloseStart?: () => void;
  onBack?: () => void;
  onBackStart?: () => void;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export const usePoolDetailSheetLayout = ({
  pool,
  instantEnter = false,
  onClose,
  onCloseStart,
  onBack,
  onBackStart,
  onTopChange,
  onDragChange,
}: UsePoolDetailSheetLayoutParams) => {
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
      console.log(
        `[EXPAND-DEBUG] t=${performance.now().toFixed(1)}ms captureAnchor()`,
        {
          anchorHeight: anchorHeightRef.current,
          anchorTranslate: anchorTranslateRef.current,
        },
      );
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

    // TEMP DEBUG: 이 마운트 이펙트가 세션 중간에 예상 밖으로 재실행되면서
    // isFullscreen을 몰래 false로 되돌리는지 확인용. 콘솔에서 "[EXPAND-DEBUG]"로 필터링.
    console.log(
      `[EXPAND-DEBUG] t=${performance.now().toFixed(1)}ms usePoolDetailSheetLayout 마운트 이펙트 실행`,
      { poolId: pool.id, wasFullscreen: isFullscreenRef.current },
    );

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
        translateRef.current = 0;
        setTranslate(0);
        applyFullscreenTransform(el);
        return;
      }

      // peek 상태는 bottom:0 + max-height: var(--peek-h)로 항상 바닥에 붙어서 늘어나므로,
      // 콘텐츠 높이가 바뀌어도 --peek-h만 갱신하면 충분하다. 예전에는 anchor(el.offsetHeight)
      // 기준으로 translateY를 delta 보정하는 applyLockedLayout을 썼는데, 이 보정값이 CSS가
      // 이미 자동으로 반영한 높이 변화를 다시 한번 translateY로 얹어버려서(이중 적용) 시트가
      // 바닥에서 떨어져 뜨는 원인이 됐다. translateY는 항상 0으로 고정한다.
      const peekH = measurePeekHeight();
      setSheetH(peekH);
      peekRef.current = peekH;
      el.style.setProperty('--peek-h', `${peekH}px`);
      setTranslate(0);
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
    applyFullscreenTransform,
    captureAnchor,
    clearExpandStyles,
    setTranslate,
    resetFullscreen,
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
};
