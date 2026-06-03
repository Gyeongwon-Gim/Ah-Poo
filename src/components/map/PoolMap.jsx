import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react'
import { useKakaoMapLoader } from '../../hooks/useKakaoMapLoader'
import { getPoolListKey } from '../../utils/poolKey'
import './PoolMap.css'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_LEVEL = 8
const USER_ZOOM_LEVEL = 6
const MAP_PADDING = 48

const PoolMap = forwardRef(function PoolMap(
  { pools, selectedPool, onSelectPool, userLocation, fitToUser = false },
  ref
) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerStoreRef = useRef(new Map())
  const onSelectPoolRef = useRef(onSelectPool)
  const syncedPoolsSignatureRef = useRef('')
  const fittedPoolsSignatureRef = useRef('')
  const userLocatedRef = useRef(false)
  const { ready, error: sdkError } = useKakaoMapLoader()

  onSelectPoolRef.current = onSelectPool

  const poolsSignature = useMemo(
    () => pools.map((p) => getPoolListKey(p)).sort().join('|'),
    [pools]
  )

  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null

  const panToUserLocation = (coords, level = USER_ZOOM_LEVEL) => {
    const map = mapInstanceRef.current
    const target = coords ?? userLocation
    if (!map || !target || !window.kakao) return false

    const pos = new window.kakao.maps.LatLng(target.lat, target.lng)
    map.panTo(pos)
    if (level != null) map.setLevel(level)
    return true
  }

  useImperativeHandle(
    ref,
    () => ({
      panToUserLocation: (coords) => panToUserLocation(coords, USER_ZOOM_LEVEL),
    }),
    [userLocation, ready]
  )

  useLayoutEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return

    const { kakao } = window
    const centerPoint =
      fitToUser && userLocation ? userLocation : DEFAULT_CENTER
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng),
      level: fitToUser && userLocation ? USER_ZOOM_LEVEL : DEFAULT_LEVEL,
    })
    mapInstanceRef.current = map

    requestAnimationFrame(() => map.relayout())
  }, [ready, fitToUser, userLocation])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!ready || !map) return

    const onResize = () => map.relayout()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [ready])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!ready || !map || !fitToUser || !userLocation || userLocatedRef.current) {
      return
    }
    if (!window.kakao) return

    userLocatedRef.current = true
    panToUserLocation(pools.length === 0 ? USER_ZOOM_LEVEL : null)
  }, [ready, fitToUser, userLocation, pools.length])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!ready || !map || !window.kakao) return
    if (poolsSignature === syncedPoolsSignatureRef.current) return

    syncedPoolsSignatureRef.current = poolsSignature
    const { kakao } = window
    const store = markerStoreRef.current
    const nextKeys = new Set(pools.map((p) => getPoolListKey(p)))

    for (const [key, entry] of store) {
      if (!nextKeys.has(key)) {
        kakao.maps.event.removeListener(entry.marker, 'click', entry.onClick)
        entry.marker.setMap(null)
        store.delete(key)
      }
    }

    for (const pool of pools) {
      const key = getPoolListKey(pool)
      if (store.has(key)) continue

      const pos = new kakao.maps.LatLng(pool.lat, pool.lng)
      const marker = new kakao.maps.Marker({ position: pos, map })
      const onClick = () => onSelectPoolRef.current(pool)
      kakao.maps.event.addListener(marker, 'click', onClick)
      store.set(key, { marker, pool, onClick })
    }
  }, [ready, poolsSignature, pools])

  useEffect(() => {
    for (const [key, { marker }] of markerStoreRef.current) {
      marker.setZIndex(key === selectedKey ? 2 : 1)
    }
  }, [selectedKey])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!ready || !map || !window.kakao) return
    if (poolsSignature === fittedPoolsSignatureRef.current) return

    fittedPoolsSignatureRef.current = poolsSignature
    const { kakao } = window

    if (pools.length === 0) {
      if (fitToUser && userLocation) {
        panToUserLocation(USER_ZOOM_LEVEL)
      }
      return
    }

    const bounds = new kakao.maps.LatLngBounds()
    if (fitToUser && userLocation) {
      bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng))
    }
    pools.forEach((pool) => {
      bounds.extend(new kakao.maps.LatLng(pool.lat, pool.lng))
    })

    if (pools.length === 1) {
      map.panTo(new kakao.maps.LatLng(pools[0].lat, pools[0].lng))
      map.setLevel(5)
    } else {
      map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING)
    }
  }, [ready, poolsSignature, pools, fitToUser, userLocation])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!ready || !map || !selectedPool || !window.kakao) return

    const pos = new window.kakao.maps.LatLng(selectedPool.lat, selectedPool.lng)
    map.panTo(pos)
  }, [ready, selectedPool])

  useEffect(() => {
    return () => {
      const { kakao } = window
      if (!kakao?.maps) return

      for (const [, entry] of markerStoreRef.current) {
        kakao.maps.event.removeListener(entry.marker, 'click', entry.onClick)
        entry.marker.setMap(null)
      }
      markerStoreRef.current.clear()
      mapInstanceRef.current = null
      syncedPoolsSignatureRef.current = ''
      fittedPoolsSignatureRef.current = ''
      userLocatedRef.current = false
    }
  }, [])

  if (sdkError) {
    return (
      <div className="pool-map pool-map--loading pool-map--error">
        <p>{sdkError}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="pool-map pool-map--loading">
        <p>지도를 불러오는 중…</p>
      </div>
    )
  }

  return (
    <div className="pool-map">
      <div ref={mapRef} className="pool-map__canvas" />
    </div>
  )
})

export default PoolMap
