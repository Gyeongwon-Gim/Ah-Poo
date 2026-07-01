function readCssColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

export function getMapThemeColor(): string {
  return readCssColor('--pf-bg-map', '#e8f4fc');
}

export function getSheetThemeColor(): string {
  return readCssColor('--pf-bg', '#f0f9ff');
}

export function applyThemeColor(color: string): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', color);
  document.documentElement.style.backgroundColor = color;
}

export function restoreDefaultThemeColor(): void {
  applyThemeColor(getMapThemeColor());
  document.documentElement.style.removeProperty('background-color');
}
