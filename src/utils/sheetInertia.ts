import { clamp } from './clamp';

export interface RunSheetInertiaOptions {
  getY: () => number;
  setY: (y: number) => void;
  getMinY: () => number;
  getMaxY: () => number;
  velocityPxPerMs: number;
  friction?: number;
  minVelocity?: number;
  onFrame?: (velocityPxPerMs: number) => void;
  onComplete: () => void;
}

/** 손을 뗀 뒤 translateY 관성 glide (SearchResultsPanel 터치 fling) */
export function runSheetInertia({
  getY,
  setY,
  getMinY,
  getMaxY,
  velocityPxPerMs,
  friction = 0.92,
  minVelocity = 0.04,
  onFrame,
  onComplete,
}: RunSheetInertiaOptions): () => void {
  let rafId: number | null = null;
  let v = velocityPxPerMs;
  let prevFrame = performance.now();

  const cancel = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const finish = () => {
    cancel();
    onComplete();
  };

  const step = () => {
    const now = performance.now();
    const frameDt = Math.max(1, now - prevFrame);
    prevFrame = now;

    v *= Math.pow(friction, frameDt / 16);

    if (Math.abs(v) < minVelocity) {
      finish();
      return;
    }

    const minY = getMinY();
    const maxY = getMaxY();
    const next = clamp(getY() + v * frameDt, minY, maxY);
    setY(next);
    onFrame?.(v);

    if (next <= minY || next >= maxY) {
      v = 0;
      onFrame?.(v);
      finish();
      return;
    }

    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);
  return cancel;
}
