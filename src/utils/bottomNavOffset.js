const FALLBACK_OFFSET = 52

function getViewportMetrics() {
  const vv = window.visualViewport
  if (!vv) {
    return {
      height: window.innerHeight,
      offsetTop: 0,
      bottomGap: 0,
    }
  }

  const height = Math.round(vv.height)
  const offsetTop = Math.round(vv.offsetTop)

  let bottomGap = Math.max(
    0,
    Math.round(window.innerHeight - offsetTop - vv.height),
  )

  // iOS PWA: visualViewport가 gap을 0으로 보고해도 fixed bottom:0이 화면 밖에 잡히는 경우
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;bottom:0;left:0;width:0;height:0;pointer-events:none;visibility:hidden;'
  document.documentElement.appendChild(probe)
  const layoutBottom = Math.round(probe.getBoundingClientRect().bottom)
  probe.remove()

  const probeGap = Math.max(0, layoutBottom - offsetTop - height)
  bottomGap = Math.max(bottomGap, probeGap)

  return { height, offsetTop, bottomGap }
}

export function getBottomNavOffsetPx() {
  const nav = document.querySelector('.bottom-nav')
  if (!nav) return FALLBACK_OFFSET

  const rect = nav.getBoundingClientRect()
  const { height: viewportH } = getViewportMetrics()
  const offset = Math.round(viewportH - rect.top)

  return offset > 0 ? offset : nav.offsetHeight
}

/** iOS PWA 뷰포트·하단 네비 위치 동기화 */
export function syncBottomNavOffset() {
  const { height, bottomGap } = getViewportMetrics()

  document.documentElement.style.setProperty('--app-vh', `${height}px`)
  document.documentElement.style.setProperty(
    '--viewport-bottom-gap',
    `${bottomGap}px`,
  )

  const nav = document.querySelector('.bottom-nav')
  if (nav) {
    nav.style.transform =
      bottomGap > 0 ? `translate3d(0, ${bottomGap}px, 0)` : ''
  }

  const offset = getBottomNavOffsetPx()
  document.documentElement.style.setProperty('--bottom-nav-offset', `${offset}px`)
  window.dispatchEvent(new Event('bottom-nav-resize'))
  return offset
}
