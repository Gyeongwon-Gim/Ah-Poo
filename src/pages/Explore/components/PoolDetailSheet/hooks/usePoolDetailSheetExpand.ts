import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { computeDragTranslate } from '@/pages/Explore/hooks/useBottomSheet';
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
} from '../constants';

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

// TEMP DEBUG: 풀스크린 전환 버그 추적용. 콘솔에서 "[EXPAND-DEBUG]"로 필터링해서 보세요.
const dlog = (...args: unknown[]) => {
  console.log(`[EXPAND-DEBUG] t=${performance.now().toFixed(1)}ms`, ...args);
};

export const usePoolDetailSheetExpand = ({
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
}: UsePoolDetailSheetExpandParams) => {
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
    dlog('commitFullscreen() 호출됨', {
      alreadyFullscreen: isFullscreenRef.current,
    });
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
    // --expand-h를 여기서 바로 지우면(clearExpandStyles), 아직 리액트 커밋 전이라 DOM에는
    // .pool-sheet--expanding 클래스(height: var(--expand-h))가 그대로 남아있는 채로 --expand-h만
    // 사라진다. 이 사이에 화면이 한 프레임이라도 그려지면 var()가 무효화되어 height가 엉뚱한
    // 값(기본 시트 높이)으로 튀었다가, 클래스 교체가 커밋되는 다음 프레임에 다시 정상으로 돌아오는
    // "튀었다 돌아오는" 현상이 생긴다. 그래서 지우는 대신 최종값(screenH)으로 먼저 맞춰두고,
    // 실제 제거는 클래스 교체가 반영된 다음 프레임으로 미룬다.
    el?.style.setProperty('--expand-h', `${screenH}px`);
    el?.style.setProperty('--peek-h', `${screenH}px`);
    applyFullscreenTransform(el);
    requestAnimationFrame(() => {
      dlog('commitFullscreen() 후처리: clearExpandStyles 지연 실행');
      clearExpandStyles(el);
    });
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
    dlog('cancelExpand() 호출됨', { expandPhase: expandPhaseRef.current });
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
    // finishExpandDrag와 같은 이유로, transition: none을 거는 클래스를 먼저 직접 떼어낸다.
    // 클래스 제거와 값 변경을 리플로우 없이 같은 틱에 연달아 하면 사파리는 둘을 하나로
    // 묶어버려 트랜지션 자체를 건너뛴다 — offsetHeight를 읽어 강제로 리플로우시켜
    // "트랜지션 켜짐" 상태를 먼저 커밋시킨 뒤에 값을 바꾼다.
    el?.classList.remove('pool-sheet--expand-dragging');
    void el?.offsetHeight;
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
    dlog('beginExpandAnimation() 호출됨(탭)', {
      isFullscreen: isFullscreenRef.current,
      expandPhase: expandPhaseRef.current,
    });
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
      dlog('finishExpandDrag() 호출됨', {
        progress,
        threshold: EXPAND_COMMIT_THRESHOLD,
      });
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
        const el = sheetRef.current;
        // setExpandDragging(false)는 리액트 상태라 다음 렌더까지 pool-sheet--expand-dragging
        // 클래스(transition: none)가 DOM에 그대로 남아있다. 그 상태에서 --expand-h를 목표값으로
        // 바로 바꾸면 트랜지션 없이 즉시 스냅되어 버리므로, 클래스를 먼저 직접 떼어낸다.
        // 클래스 제거와 값 변경을 리플로우 없이 같은 틱에 연달아 하면(특히 사파리에서) 브라우저가
        // 둘을 하나로 묶어버려 트랜지션 자체를 건너뛴다 — offsetHeight를 읽어 강제로 리플로우시켜
        // "트랜지션 켜짐" 상태를 먼저 커밋시킨 뒤에 값을 바꾼다.
        el?.classList.remove('pool-sheet--expand-dragging');
        void el?.offsetHeight;
        el?.style.setProperty('--expand-h', `${screenH}px`);
        el?.style.setProperty('border-radius', '0');
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
      dlog('handleExpandTransitionEnd (height 트랜지션 종료)', {
        expandPhase: expandPhaseRef.current,
        expandProgress: expandProgressRef.current,
      });
      if (expandPhaseRef.current !== 'animating') return;

      if (expandProgressRef.current >= 1) {
        commitFullscreen();
        return;
      }

      if (expandProgressRef.current <= 0) {
        expandPhaseRef.current = 'idle';
        setExpandPhase('idle');
        // commitFullscreen()과 같은 이유: --expand-h를 여기서 바로 지우면 아직 리액트가
        // .pool-sheet--expanding 클래스를 못 뗀 채로 var()가 무효화되어 height가 순간
        // 튀어보일 수 있다. 클래스 제거가 커밋된 다음 프레임으로 정리를 미룬다.
        const el = sheetRef.current;
        requestAnimationFrame(() => {
          dlog('cancelExpand 완료 후처리: clearExpandStyles 지연 실행');
          clearExpandStyles(el);
        });
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
    dlog('finishHeaderDismissDrag()', {
      visible,
      closeThreshold: SHEET_CLOSE_THRESHOLD,
      isFullscreen: isFullscreenRef.current,
      sheetH,
      translate: translateRef.current,
    });
    if (visible < SHEET_CLOSE_THRESHOLD) {
      handleCloseRef.current();
      return;
    }
    snapToPeekWithTransitionRef.current();
  }, [
    handleCloseRef,
    isFullscreenRef,
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
        dlog('header 제스처 모드 확정: expand', { deltaY });
        gesture.mode = 'expand';
        expandStartHRef.current = peekRef.current;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateExpandProgress(deltaYToExpandProgress(deltaY), {
          dragging: true,
        });
        return;
      }

      dlog('header 제스처 모드 확정: dismiss', { deltaY });
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

    dlog('onHeaderPointerUp', {
      mode: gesture.mode,
      expandProgress: expandProgressRef.current,
    });
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

    // iOS 사파리는 네이티브 스크롤/제스처로 판단되면 우리 JS 트래킹 도중에도
    // 강제로 pointercancel을 쏠 수 있다 — onHeaderPointerUp과 다른 시점에
    // 다른 상태값으로 마무리될 수 있어 원인일 가능성이 있는 지점.
    dlog('onHeaderPointerCancel (사파리가 강제 취소했을 수 있음)', {
      mode: gesture.mode,
      expandProgress: expandProgressRef.current,
    });
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
    dlog('onPeekBodyPointerUp', {
      expandPhase: expandPhaseRef.current,
      expandProgress: expandProgressRef.current,
    });
    if (expandPhaseRef.current === 'dragging') {
      finishExpandDrag(expandProgressRef.current);
    }
  };

  const onPeekBodyPointerCancel = (e: ReactPointerEvent) => {
    const gesture = peekBodyGestureRef.current;
    peekBodyGestureRef.current = null;
    if (!gesture || gesture.pointerId !== e.pointerId) return;

    dlog('onPeekBodyPointerCancel (사파리가 강제 취소했을 수 있음)', {
      expandPhase: expandPhaseRef.current,
      expandProgress: expandProgressRef.current,
    });
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
};
