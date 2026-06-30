/** 검색 결과 목록: null/NaN 안전, 1km 미만은 m 단위 */
export function formatDistance(km: number | null | undefined): string | null {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** 상세 시트: 숫자일 때만 소수 첫째 자리 km 표기 */
export function formatDistanceKmLabel(distanceKm: number): string {
  return `${distanceKm.toFixed(1)}km`;
}
