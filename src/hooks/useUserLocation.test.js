import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUserLocation } from './useUserLocation'

function mockGeolocation(getCurrentPositionImpl, watchPositionImpl) {
  Object.defineProperty(global.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: getCurrentPositionImpl,
      watchPosition:
        watchPositionImpl ??
        ((_success, error) => {
          error({ code: 3 })
          return 1
        }),
      clearWatch: vi.fn(),
    },
  })
}

describe('useUserLocation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(global.navigator, 'permissions', {
      configurable: true,
      value: undefined,
    })
  })

  it('위치를 받으면 ready 상태와 좌표를 반환한다', async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 37.5, longitude: 127.0 },
      })
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.location).toEqual({ lat: 37.5, lng: 127.0 })
  })

  it('권한 거부(code 1)이면 denied 상태가 된다', async () => {
    mockGeolocation((_success, error) => {
      error({ code: 1 })
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.status).toBe('denied'))
  })

  it('Safari 타임아웃(code 3)은 denied가 아니라 unavailable 상태가 된다', async () => {
    mockGeolocation((_success, error) => {
      error({ code: 3 })
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    expect(result.current.status).not.toBe('denied')
  })

  it('첫 시도 실패 후 재시도에 성공하면 ready 상태가 된다', async () => {
    let callCount = 0
    mockGeolocation((success, error) => {
      callCount += 1
      if (callCount === 1) {
        error({ code: 3 })
        return
      }
      success({
        coords: { latitude: 37.5, longitude: 127.0 },
      })
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(callCount).toBeGreaterThan(1)
  })

  it('permissions API가 granted인데 code 1이 와도 unavailable이다', async () => {
    Object.defineProperty(global.navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' }),
      },
    })

    mockGeolocation((_success, error) => {
      error({ code: 1 })
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
  })
})
