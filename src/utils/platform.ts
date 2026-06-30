export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** 홈 화면 추가 등 PWA(standalone)로 실행 중인지 */
export function isPwa(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneMedia = window.matchMedia(
    '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)',
  );

  return (
    standaloneMedia.matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** html에 app--pwa / app--browser 클래스를 붙여 CSS 분기 */
export function applyAppDisplayModeClass(): void {
  const root = document.documentElement;

  if (isPwa()) {
    root.classList.add('app--pwa');
    root.classList.remove('app--browser');
  } else {
    root.classList.add('app--browser');
    root.classList.remove('app--pwa');
  }
}
