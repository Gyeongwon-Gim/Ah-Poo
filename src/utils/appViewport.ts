interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let safeAreaProbe: HTMLDivElement | null = null;

function measureSafeAreaInsets(): SafeAreaInsets {
  if (!safeAreaProbe) {
    safeAreaProbe = document.createElement('div');
    safeAreaProbe.style.cssText =
      'position:fixed;top:0;left:0;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);visibility:hidden;pointer-events:none;';
    document.documentElement.appendChild(safeAreaProbe);
  }

  const cs = getComputedStyle(safeAreaProbe);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
}

/** 키보드가 떠 있다고 판단하는 visualViewport 축소량(px) 기준 */
const KEYBOARD_THRESHOLD_PX = 120;

/**
 * iOS viewport-fit=cover: innerHeight는 홈 인디케이터 위까지만 잡힌다.
 * --screen-h를 innerHeight + safe-bottom 으로 맞춰 물리 화면 끝까지 채운다.
 */
export function syncAppViewport(): void {
  const root = document.documentElement;
  const body = document.body;
  const vv = window.visualViewport;
  const safe = measureSafeAreaInsets();
  const heightDelta = vv ? window.innerHeight - vv.height : 0;
  const keyboardOpen = vv && heightDelta > KEYBOARD_THRESHOLD_PX;

  if (vv) {
    root.style.setProperty('--vv-height', `${vv.height}px`);
    root.style.setProperty('--vv-offset-top', `${vv.offsetTop}px`);
  }

  const keyboardOverlap =
    keyboardOpen && vv
      ? Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
      : 0;
  root.style.setProperty('--keyboard-overlap', `${keyboardOverlap}px`);

  if (keyboardOpen && vv) {
    body.style.top = `${vv.offsetTop}px`;
    body.style.height = `${vv.height}px`;
    body.style.bottom = 'auto';
    root.style.setProperty('--screen-h', `${vv.height}px`);
    root.classList.add('keyboard-open');
  } else {
    body.style.top = '';
    body.style.height = '';
    body.style.bottom = '';
    root.style.setProperty(
      '--screen-h',
      `${window.innerHeight + safe.bottom}px`,
    );
    root.classList.remove('keyboard-open');
  }

  window.dispatchEvent(new Event('screen-resize'));
}
