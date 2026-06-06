const FALLBACK_OFFSET = 52

export function getBottomNavOffsetPx() {
  const nav = document.querySelector('.bottom-nav')
  return nav?.offsetHeight ?? FALLBACK_OFFSET
}

/** 실제 bottom-nav 높이를 CSS 변수에 반영 */
export function syncBottomNavOffset() {
  const height = getBottomNavOffsetPx()
  document.documentElement.style.setProperty('--bottom-nav-offset', `${height}px`)
  return height
}
