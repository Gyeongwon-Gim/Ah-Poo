import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { UseBottomSheetOptions } from '../types/sheet';
import { clamp } from '../utils/clamp';

const DEFAULT_CLOSE_THRESHOLD = 96;

interface DragState {
  startY: number;
  startTranslate: number;
  moved: number;
}

export interface UseBottomSheetParams extends UseBottomSheetOptions {
  maxTranslate: number;
}

/** 수직 시트 드래그 translate 계산 (SearchResultsPanel 등) */
export function computeDragTranslate(
  startTranslate: number,
  startY: number,
  clientY: number,
  min: number,
  max: number,
): number {
  return clamp(startTranslate + (clientY - startY), min, max);
}

export function useBottomSheet({
  maxTranslate,
  snapPoints,
  closeThreshold = DEFAULT_CLOSE_THRESHOLD,
  enabled = true,
  onDragChange,
  onClose,
  onAfterDrag,
}: UseBottomSheetParams) {
  const [translate, setTranslateState] = useState(snapPoints.peek);
  const [dragging, setDragging] = useState(false);
  const translateRef = useRef(translate);
  const dragRef = useRef<DragState | null>(null);
  const onDragChangeRef = useRef(onDragChange);

  onDragChangeRef.current = onDragChange;

  const setTranslate = useCallback(
    (value: number | ((prev: number) => number)) => {
      const next =
        typeof value === 'function' ? value(translateRef.current) : value;
      translateRef.current = next;
      setTranslateState(next);
    },
    [],
  );

  useEffect(() => {
    onDragChangeRef.current?.(dragging);
    return () => onDragChangeRef.current?.(false);
  }, [dragging]);

  const snapTo = useCallback(
    (target: number) => {
      setTranslate(clamp(target, snapPoints.full, maxTranslate));
    },
    [maxTranslate, setTranslate, snapPoints.full],
  );

  const snapToPeek = useCallback(() => {
    snapTo(snapPoints.peek);
  }, [snapPoints.peek, snapTo]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!enabled) return;

      dragRef.current = {
        startY: e.clientY,
        startTranslate: translateRef.current,
        moved: 0,
      };
      setDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const delta = e.clientY - drag.startY;
      drag.moved = Math.max(drag.moved, Math.abs(delta));
      setTranslate(
        computeDragTranslate(
          drag.startTranslate,
          drag.startY,
          e.clientY,
          snapPoints.full,
          maxTranslate,
        ),
      );
    },
    [maxTranslate, setTranslate, snapPoints.full],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag) return;

    const visible = maxTranslate - translateRef.current;

    if (onAfterDrag) {
      onAfterDrag({ translate: translateRef.current, visible });
      return;
    }

    if (visible < closeThreshold) {
      onClose?.();
      return;
    }

    snapToPeek();
  }, [closeThreshold, maxTranslate, onAfterDrag, onClose, snapToPeek]);

  return {
    translate,
    setTranslate,
    translateRef,
    dragging,
    grabberHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    snapTo,
    snapToPeek,
  };
}
