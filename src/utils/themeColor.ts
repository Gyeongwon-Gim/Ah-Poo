function readCssColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

export function getMapThemeColor(): string {
  return readCssColor('--ap-bg-map', '#e8f4fc');
}

export function getSheetThemeColor(): string {
  return readCssColor('--ap-bg', '#f0f9ff');
}

/**
 * `.pool-map`이 `position: fixed; top:0; bottom:0;`로 화면 전체를 자기 배경색
 * (--ap-bg-map)으로 덮고 있어서, html 자체의 background만 바꿔서는 안 보인다.
 * --ap-bg-map 변수 자체를 덮어써야 지도 레이어까지 같이 바뀐다.
 */
export function applyThemeColor(color: string): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', color);
  document.documentElement.style.setProperty('--ap-bg-map', color);
}

export function restoreDefaultThemeColor(): void {
  applyThemeColor(getMapThemeColor());
  document.documentElement.style.removeProperty('--ap-bg-map');
}
