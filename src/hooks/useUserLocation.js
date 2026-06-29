import { useCallback, useEffect, useState } from 'react'

const PERMISSION_DENIED = 1

/** Safari는 고정밀·캐시 없음 조합에서 타임아웃이 잦아 저정밀·캐시 허용부터 시도 */
const GEO_STRATEGIES = [
  { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
  { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
  { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
]

function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/** watchPosition은 iOS Safari에서 getCurrentPosition보다 안정적인 경우가 있다 */
function watchPositionOnce(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'))
      return
    }

    const timeoutMs = options.timeout ?? 10000
    let watchId

    const cleanup = () => {
      clearTimeout(timer)
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
    }

    const timer = setTimeout(() => {
      cleanup()
      const err = new Error('timeout')
      err.code = 3
      reject(err)
    }, timeoutMs)

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        cleanup()
        resolve(pos)
      },
      (err) => {
        cleanup()
        reject(err)
      },
      options,
    )
  })
}

async function queryGeolocationPermission() {
  if (!navigator.permissions?.query) return null
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return null
  }
}

function resolveLocationStatus(error, permissionState) {
  if (permissionState === 'granted') return 'unavailable'
  if (error?.code === PERMISSION_DENIED || permissionState === 'denied') {
    return 'denied'
  }
  return 'unavailable'
}

async function requestLocation() {
  const permissionState = await queryGeolocationPermission()
  if (permissionState === 'denied') {
    const err = new Error('denied')
    err.code = PERMISSION_DENIED
    throw err
  }

  let lastError

  for (const options of GEO_STRATEGIES) {
    try {
      return await getCurrentPosition(options)
    } catch (err) {
      lastError = err
      if (err?.code === PERMISSION_DENIED) throw err
    }
  }

  try {
    return await watchPositionOnce(GEO_STRATEGIES[0])
  } catch (err) {
    lastError = err
    if (err?.code === PERMISSION_DENIED) throw err
  }

  const status = resolveLocationStatus(lastError, permissionState)
  const wrapped = new Error(status)
  wrapped.code = lastError?.code
  throw wrapped
}

export function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('pending')

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return Promise.reject(new Error('unsupported'))
    }

    setStatus((prev) => (prev === 'ready' ? prev : 'pending'))

    return requestLocation()
      .then((pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setLocation(next)
        setStatus('ready')
        return next
      })
      .catch(async (err) => {
        const permissionState = await queryGeolocationPermission()
        const nextStatus =
          err.message === 'denied' || err.message === 'unavailable'
            ? err.message
            : resolveLocationStatus(err, permissionState)
        setStatus(nextStatus)
        return Promise.reject(new Error(nextStatus))
      })
  }, [])

  useEffect(() => {
    refreshLocation().catch(() => {})
  }, [refreshLocation])

  return { location, status, refreshLocation }
}
