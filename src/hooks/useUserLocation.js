import { useCallback, useEffect, useState } from 'react'

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 60000,
}

export function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('pending')

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return Promise.reject(new Error('unsupported'))
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          setLocation(next)
          setStatus('ready')
          resolve(next)
        },
        () => {
          setStatus('denied')
          reject(new Error('denied'))
        },
        { ...GEO_OPTIONS, maximumAge: 0 }
      )
    })
  }, [])

  useEffect(() => {
    refreshLocation()
  }, [refreshLocation])

  return { location, status, refreshLocation }
}
