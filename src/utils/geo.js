const EARTH_RADIUS_KM = 6371

/** 두 좌표 사이 거리(km), Haversine */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 기본 주변 반경(km) — 첫 화면 마커 필터 */
export const NEARBY_RADIUS_KM = 10

export function filterPoolsWithinKm(pools, origin, radiusKm = NEARBY_RADIUS_KM) {
  if (!origin?.lat || !origin?.lng) return pools

  return pools
    .map((pool) => ({
      ...pool,
      distanceKm: getDistanceKm(origin.lat, origin.lng, pool.lat, pool.lng),
    }))
    .filter((pool) => pool.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
