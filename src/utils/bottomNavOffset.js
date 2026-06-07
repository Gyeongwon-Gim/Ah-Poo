const FALLBACK_OFFSET = 52

export function getBottomNavOffsetPx() {
  const nav = document.querySelector('.bottom-nav')
  if (!nav) return FALLBACK_OFFSET

  const rect = nav.getBoundingClientRect()
  const viewportH = window.visualViewport?.height ?? window.innerHeight
  const offset = Math.round(viewportH - rect.top)

  return offset > 0 ? offset : nav.offsetHeight
}

/** 실제 bottom-nav 높이를 CSS 변수에 반영 */
export function syncBottomNavOffset() {
  const height = getBottomNavOffsetPx()
  document.documentElement.style.setProperty('--bottom-nav-offset', `${height}px`)
  return height
}
