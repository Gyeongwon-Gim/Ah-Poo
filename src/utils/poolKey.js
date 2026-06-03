export function poolToSearchParams(pool) {
  const params = new URLSearchParams({
    name: pool.name,
    address: pool.address,
    lat: String(pool.lat),
    lng: String(pool.lng),
  })
  return params.toString()
}

export function parsePoolKeyFromSearchParams(searchParams) {
  const name = searchParams.get('name')
  const address = searchParams.get('address')
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!name || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }

  return { name, address, lat, lng }
}

export function getPoolListKey(pool) {
  return `${pool.name}|${pool.address}|${pool.lat}|${pool.lng}`
}
