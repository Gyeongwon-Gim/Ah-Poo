const FALLBACK_OFFSET = 52

export function getBottomNavOffsetPx() {
  const nav = document.querySelector('.bottom-nav')
  return nav?.offsetHeight ?? FALLBACK_OFFSET
}

/** bottom-nav 실측 높이를 CSS 변수에 반영 (시트·플로팅 버튼용) */
export function syncBottomNavOffset() {
  const height = getBottomNavOffsetPx()
  document.documentElement.style.setProperty('--bottom-nav-offset', `${height}px`)
  document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`)
  window.dispatchEvent(new Event('bottom-nav-resize'))
  return height
}
