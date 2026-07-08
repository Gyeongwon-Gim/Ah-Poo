import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { computeDragTranslate } from './useBottomSheet';
import { clamp } from '@/utils/clamp';
import type { BottomSheetSnapPoints } from '@/types/sheet';
import {
  EXPAND_COMMIT_THRESHOLD,
  GESTURE_LOCK_PX,
  SHEET_CLOSE_THRESHOLD,
  SWIPE_MAX_HORIZONTAL,
  getScreenHeight,
  type ExpandPhase,
  type HeaderGesture,
  type PeekBodyGesture,
} from '@/pages/Home/components/PoolDetailSheet';

export interface PoolDetailExpandState {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  isFullscreenRef: MutableRefObject<boolean>;
  expandPhase: ExpandPhase;
  setExpandPhase: (value: ExpandPhase) => void;
  expandPhaseRef: MutableRefObject<ExpandPhase>;
  expandDragging: boolean;
  setExpandDragging: (value: boolean) => void;
  headerDragging: boolean;
  setHeaderDragging: (value: boolean) => void;
}

export interface UsePoolDetailSheetExpandParams {
  sheetRef: RefObject<HTMLDivElement | null>;
  peekRef: MutableRefObject<number>;
  translateRef: MutableRefObject<number>;
  setTranslate: (value: number) => void;
  setSheetH: (height: number) => void;
  snapPoints: BottomSheetSnapPoints;
  sheetH: number;
  onDragChange?: (dragging: boolean) => void;
  handleCloseRef: MutableRefObject<() => void>;
  snapToPeekWithTransitionRef: MutableRefObject<() => void>;
  clearExpandStyles: (el: HTMLElement | null) => void;
  applyFullscreenTransform: (el: HTMLElement | null) => void;
  expandState: PoolDetailExpandState;
}

export function usePoolDetailSheetExpand({
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
}: UsePoolDetailSheetExpandParams) {
  const {
    isFullscreenRef,
    setIsFullscreen,
    expandPhaseRef,
    setExpandPhase,
    setExpandDragging,
    setHeaderDragging,
  } = expandState;

  const expandProgressRef = useRef(0);
  const expandStartHRef = useRef(0);
  const headerGestureRef = useRef<HeaderGesture | null>(null);
  const peekBodyGestureRef = useRef<PeekBodyGesture | null>(null);

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
  }, [
    applyFullscreenTransform,
    clearExpandStyles,
    expandPhaseRef,
    isFullscreenRef,
    peekRef,
    setExpandDragging,
    setExpandPhase,
    setIsFullscreen,
    setSheetH,
    setTranslate,
    sheetRef,
    translateRef,
  ]);

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
    [expandPhaseRef, peekRef, setExpandDragging, setExpandPhase, sheetRef],
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
  }, [
    clearExpandStyles,
    expandPhaseRef,
    peekRef,
    setExpandDragging,
    setExpandPhase,
    sheetRef,
  ]);

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
  }, [
    commitFullscreen,
    expandPhaseRef,
    isFullscreenRef,
    peekRef,
    setExpandDragging,
    setExpandPhase,
    sheetRef,
  ]);

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
    [
      cancelExpand,
      commitFullscreen,
      expandPhaseRef,
      setExpandDragging,
      setExpandPhase,
      sheetRef,
    ],
  );

  const resetExpandInstant = useCallback(() => {
    expandPhaseRef.current = 'idle';
    setExpandPhase('idle');
    setExpandDragging(false);
    setHeaderDragging(false);
    clearExpandStyles(sheetRef.current);
  }, [
    clearExpandStyles,
    expandPhaseRef,
    setExpandDragging,
    setExpandPhase,
    setHeaderDragging,
    sheetRef,
  ]);

  const resetFullscreen = useCallback(() => {
    setIsFullscreen(false);
    isFullscreenRef.current = false;
  }, [isFullscreenRef, setIsFullscreen]);

  const handleExpandTransitionEnd = useCallback(
    (e: ReactTransitionEvent) => {
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
    [
      clearExpandStyles,
      commitFullscreen,
      expandPhaseRef,
      setExpandPhase,
      sheetRef,
    ],
  );

  const deltaYToExpandProgress = useCallback(
    (deltaY: number) => {
      const peekH = expandStartHRef.current || peekRef.current;
      const screenH = getScreenHeight();
      const range = Math.max(0, screenH - peekH);
      if (range <= 0) return 1;
      return clamp(-deltaY / range, 0, 1);
    },
    [peekRef],
  );

  const finishHeaderDismissDrag = useCallback(() => {
    setHeaderDragging(false);
    onDragChange?.(false);
    const visible = sheetH - translateRef.current;
    if (visible < SHEET_CLOSE_THRESHOLD) {
      handleCloseRef.current();
      return;
    }
    snapToPeekWithTransitionRef.current();
  }, [
    handleCloseRef,
    onDragChange,
    setHeaderDragging,
    sheetH,
    snapToPeekWithTransitionRef,
    translateRef,
  ]);

  const onHeaderPointerDown = (e: ReactPointerEvent) => {
    if (expandPhaseRef.current === 'animating') return;
    headerGestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      mode: 'undecided',
      pointerId: e.pointerId,
    };
  };

  const onHeaderPointerMove = (e: ReactPointerEvent) => {
    const gesture = headerGestureRef.current;
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
      setHeaderDragging(true);
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

  const onHeaderPointerUp = (e: ReactPointerEvent) => {
    const gesture = headerGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) {
      headerGestureRef.current = null;
      return;
    }

    if (gesture.mode === 'expand') {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      finishExpandDrag(expandProgressRef.current);
    } else if (gesture.mode === 'dismiss') {
      finishHeaderDismissDrag();
    } else {
      const moved = Math.hypot(
        e.clientX - gesture.startX,
        e.clientY - gesture.startY,
      );
      if (moved < GESTURE_LOCK_PX) {
        beginExpandAnimation();
      }
    }

    headerGestureRef.current = null;
  };

  const onHeaderPointerCancel = (e: ReactPointerEvent) => {
    const gesture = headerGestureRef.current;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    if (gesture.mode === 'expand') {
      finishExpandDrag(expandProgressRef.current);
    } else if (gesture.mode === 'dismiss') {
      finishHeaderDismissDrag();
    }
    headerGestureRef.current = null;
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

    if (
      Math.abs(deltaY) >= GESTURE_LOCK_PX ||
      expandPhaseRef.current !== 'idle'
    ) {
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

  return {
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
  };
}
