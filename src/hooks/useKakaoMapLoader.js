import { useEffect, useState } from 'react'

const KAKAO_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js'
const LOAD_TIMEOUT_MS = 15000

const MAP_SETUP_HINT =
  '카카오 개발자 콘솔 → 내 애플리케이션 → 해당 앱 → 「제품 설정」에서 「지도/로컬」을 ON으로 켜 주세요. JavaScript 키와 Web 도메인(http://localhost:3000)도 확인하세요.'

let loadPromise = null

function rejectIfNoKakaoMaps(reject) {
  loadPromise = null
  reject(
    new Error(
      `카카오맵 API를 초기화하지 못했습니다. ${MAP_SETUP_HINT}`
    )
  )
}

function loadKakaoSdk(appKey) {
  if (window.kakao?.maps?.Map) {
    return Promise.resolve(window.kakao)
  }

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const finishLoad = () => {
      if (!window.kakao?.maps) {
        rejectIfNoKakaoMaps(reject)
        return
      }

      window.kakao.maps.load(() => {
        if (!window.kakao?.maps?.Map) {
          rejectIfNoKakaoMaps(reject)
          return
        }
        resolve(window.kakao)
      })
    }

    const existing = document.querySelector(`script[src^="${KAKAO_SDK_URL}"]`)
    if (existing) {
      if (existing.dataset.kakaoError) {
        reject(new Error(existing.dataset.kakaoError))
        loadPromise = null
        return
      }

      if (window.kakao?.maps) {
        finishLoad()
        return
      }

      if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
        finishLoad()
        return
      }

      existing.addEventListener('load', finishLoad, { once: true })
      existing.addEventListener(
        'error',
        () => {
          loadPromise = null
          reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'))
        },
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = `${KAKAO_SDK_URL}?appkey=${appKey}&autoload=false`
    script.async = true

    const timeoutId = window.setTimeout(() => {
      loadPromise = null
      script.dataset.kakaoError = `카카오맵 로드 시간이 초과되었습니다. ${MAP_SETUP_HINT}`
      reject(new Error(script.dataset.kakaoError))
    }, LOAD_TIMEOUT_MS)

    script.onload = () => {
      window.clearTimeout(timeoutId)
      finishLoad()
    }

    script.onerror = () => {
      window.clearTimeout(timeoutId)
      loadPromise = null
      reject(
        new Error(
          `카카오맵 SDK를 불러오지 못했습니다. 키·도메인·지도/로컬 서비스 활성화를 확인하세요.`
        )
      )
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

// 모듈이 평가되는 즉시 SDK 다운로드를 선제적으로 시작한다.
// 컴포넌트 마운트·effect 실행을 기다리지 않으므로 지도 타일이 더 빨리 그려진다.
// (loadKakaoSdk는 loadPromise로 메모이즈되어 훅에서 재호출해도 중복 요청이 없다.)
const PREFETCH_APP_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY
if (typeof window !== 'undefined' && PREFETCH_APP_KEY) {
  loadKakaoSdk(PREFETCH_APP_KEY).catch(() => {})
}

function isKakaoMapReady() {
  return typeof window !== 'undefined' && Boolean(window.kakao?.maps?.Map)
}

export function useKakaoMapLoader() {
  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY
  const [ready, setReady] = useState(isKakaoMapReady)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!appKey) {
      setError('VITE_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.')
      setReady(false)
      return
    }

    let cancelled = false

    loadKakaoSdk(appKey)
      .then(() => {
        if (!cancelled) {
          setReady(true)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? '카카오맵 로드 실패')
          setReady(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [appKey])

  return { ready, error, appKey }
}
