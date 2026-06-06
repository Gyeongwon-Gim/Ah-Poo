const MAP_BG = '#e8f4fc'
const STANDALONE_FALLBACK_INSET = 59

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

function measureSafeAreaTop() {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;height:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none;'
  document.documentElement.appendChild(probe)
  const inset = probe.getBoundingClientRect().height
  probe.remove()
  return inset
}

export function applyPwaSafeAreaInsets() {
  const measured = measureSafeAreaTop()
  const inset =
    measured > 0
      ? measured
      : isStandalone()
        ? STANDALONE_FALLBACK_INSET
        : 0

  document.documentElement.style.setProperty('--pwa-top-inset', `${inset}px`)
  document.documentElement.style.backgroundColor = MAP_BG
  document.body.style.backgroundColor = MAP_BG

  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) themeMeta.setAttribute('content', MAP_BG)
}

export function watchPwaSafeAreaInsets() {
  applyPwaSafeAreaInsets()

  const onChange = () => applyPwaSafeAreaInsets()
  window.addEventListener('resize', onChange)
  window.visualViewport?.addEventListener('resize', onChange)

  return () => {
    window.removeEventListener('resize', onChange)
    window.visualViewport?.removeEventListener('resize', onChange)
  }
}
