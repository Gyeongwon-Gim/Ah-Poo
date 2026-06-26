export function poolToSearchParams(pool) {
  const params = new URLSearchParams({
    name: pool.name,
    roadAddress: pool.roadAddress,
    lat: String(pool.lat),
    lng: String(pool.lng),
  })
  return params.toString()
}

export function parsePoolKeyFromSearchParams(searchParams) {
  const name = searchParams.get('name')
  const roadAddress = searchParams.get('roadAddress')
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!name || !roadAddress || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  return { name, roadAddress, lat, lng }
}

export function getPoolListKey(pool) {
  return `${pool.name}|${pool.roadAddress}|${pool.lat}|${pool.lng}`
}
