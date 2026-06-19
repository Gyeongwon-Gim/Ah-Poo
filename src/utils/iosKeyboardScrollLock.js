import { isIOS } from './platform.js';

let initialScrollY = 0;
let focusCount = 0;
let maxKeyboardPush = 0;
let listenersAttached = false;
let scheduledPassIds = [];

function getScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function scrollToY(y) {
  window.scrollTo(0, y);
  document.documentElement.scrollTop = y;
}

function syncInputFocusedClass() {
  document.documentElement.classList.toggle('input-focused', focusCount > 0);
}

function requestViewportSync() {
  window.dispatchEvent(new Event('app-viewport-sync-request'));
}

function clearScheduledPasses() {
  scheduledPassIds.forEach((id) => window.clearTimeout(id));
  scheduledPassIds = [];
}

function scheduleScrollLockPasses() {
  clearScheduledPasses();
  [0, 50, 150, 300, 500].forEach((ms) => {
    scheduledPassIds.push(window.setTimeout(handleScrollLock, ms));
  });
}

/**
 * iOS Safari: 가상키보드가 document를 밀어 scrollY가 늘어나며 하단에 빈 영역이 생긴다.
 * @see https://www.ycow-dev.com/blog/posts/issues/ios_virtual_keyboards
 */
function handleScrollLock() {
  if (focusCount === 0) return;

  const currentScrollY = getScrollY();

  if (!initialScrollY) {
    initialScrollY = currentScrollY;
  }

  const delta = Math.max(0, currentScrollY - initialScrollY);
  if (delta > 0) {
    maxKeyboardPush = Math.max(maxKeyboardPush, delta);
    scrollToY(initialScrollY);
  }

  const vv = window.visualViewport;
  if (vv?.offsetTop > 0) {
    maxKeyboardPush = Math.max(maxKeyboardPush, vv.offsetTop);
  }

  requestViewportSync();
}

function attachListeners() {
  if (listenersAttached) return;
  window.visualViewport?.addEventListener('resize', handleScrollLock);
  window.visualViewport?.addEventListener('scroll', handleScrollLock);
  window.addEventListener('scroll', handleScrollLock);
  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  window.visualViewport?.removeEventListener('resize', handleScrollLock);
  window.visualViewport?.removeEventListener('scroll', handleScrollLock);
  window.removeEventListener('scroll', handleScrollLock);
  listenersAttached = false;
}

/** @returns {boolean} iOS에서 텍스트 입력 포커스 중인지 */
export function isIosKeyboardInputFocused() {
  return focusCount > 0;
}

/** iOS 키보드로 document가 밀린 정도(px) */
export function getIosKeyboardPushAmount() {
  return maxKeyboardPush;
}

/** input/textarea focus·blur 시 호출 */
export function setIosKeyboardInputFocused(focused) {
  if (!isIOS()) return;

  if (focused) {
    focusCount += 1;
    if (focusCount === 1) {
      initialScrollY = getScrollY();
      maxKeyboardPush = 0;
      attachListeners();
      scheduleScrollLockPasses();
    }
    syncInputFocusedClass();
    requestViewportSync();
  } else {
    focusCount = Math.max(0, focusCount - 1);
    if (focusCount === 0) {
      initialScrollY = 0;
      maxKeyboardPush = 0;
      clearScheduledPasses();
      detachListeners();
    }
    syncInputFocusedClass();
    requestViewportSync();
  }
}
