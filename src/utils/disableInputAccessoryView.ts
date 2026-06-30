import { isIOS } from './platform';

/**
 * iOS Safari / WKWebView에서 키보드 위 inputAccessoryView(이전·다음·완료 바)를 숨긴다.
 * touchstart 시점에만 readonly 트릭 — focus에서 하면 키보드가 안 뜬다.
 */
export function disableInputAccessoryView(
  element: HTMLElement | null | undefined,
): () => void {
  if (!element || !isIOS()) return () => {};

  const stripAccessory = () => {
    element.setAttribute('readonly', 'readonly');
    window.setTimeout(() => element.removeAttribute('readonly'), 0);
  };

  element.addEventListener('touchstart', stripAccessory, { passive: true });
  return () => element.removeEventListener('touchstart', stripAccessory);
}
