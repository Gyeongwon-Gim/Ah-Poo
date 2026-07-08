import {
  SHEET_CLOSE_MS,
  SHEET_CLOSE_THRESHOLD,
  SHEET_ENTER_MS,
} from '@/utils/sheetConstants';

export { SHEET_CLOSE_MS, SHEET_CLOSE_THRESHOLD, SHEET_ENTER_MS };

export const BLOG_INITIAL_VISIBLE = 3;
export const BLOG_LOAD_MORE_STEP = 3;
export const SWIPE_MAX_HORIZONTAL = 24;
export const GESTURE_LOCK_PX = 8;
export const EXPAND_COMMIT_THRESHOLD = 0.25;

export type ExpandPhase = 'idle' | 'dragging' | 'animating';

export interface HeaderGesture {
  startX: number;
  startY: number;
  mode: 'undecided' | 'expand' | 'dismiss';
  pointerId: number;
  dismissStartTranslate?: number;
}

export interface PeekBodyGesture {
  startX: number;
  startY: number;
  pointerId: number;
}

export function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

export function getScreenHeight() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--screen-h')
    .trim();
  const px = Number.parseFloat(raw);
  if (raw.endsWith('px') && Number.isFinite(px) && px > 0) {
    return px;
  }
  return getViewportHeight();
}
