const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * 터치 드래그량과 scrollTop을 1:1로 맞춘다. 손을 떼면 그 자리에서 멈춘다.
 * @returns {() => void} cleanup
 */
export function attachDirectTouchScroll(element, options = {}) {
  const { onGestureStart, onGestureEnd } = options;

  let tracking = false;
  let startScrollTop = 0;
  let lastY = 0;

  const maxScroll = () =>
    Math.max(0, element.scrollHeight - element.clientHeight);

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    tracking = true;
    lastY = e.touches[0].clientY;
    startScrollTop = element.scrollTop;
  };

  const onTouchMove = (e) => {
    if (!tracking || e.touches.length !== 1) return;

    const y = e.touches[0].clientY;

    // 리스트 최상단에서 아래로 당기면 시트 드래그에 맡긴다.
    if (startScrollTop <= 0 && element.scrollTop <= 0 && y > lastY) {
      tracking = false;
      onGestureEnd?.();
      return;
    }

    const delta = lastY - y;
    if (delta === 0) return;

    element.scrollTop = clamp(element.scrollTop + delta, 0, maxScroll());
    lastY = y;

    e.preventDefault();
    onGestureStart?.();
  };

  const onTouchEnd = () => {
    if (!tracking) return;
    tracking = false;
    onGestureEnd?.();
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchEnd);
  };
}

/** @deprecated attachDirectTouchScroll 사용 */
export function attachMomentumScroll(element, options) {
  return attachDirectTouchScroll(element, options);
}
