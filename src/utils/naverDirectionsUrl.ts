import type { Pool } from '../types/pool';

const APP_NAME = 'https://ah-poo.kr';
const APP_FALLBACK_DELAY_MS = 1500;

type DirectionsPool = Pick<Pool, 'name' | 'lat' | 'lng'>;

/** 네이버 지도 앱 대중교통 길찾기 URL (nmap://) */
export function buildNaverDirectionsAppUrl(pool: DirectionsPool): string {
  const params = new URLSearchParams({
    dlat: String(pool.lat),
    dlng: String(pool.lng),
    dname: pool.name,
    appname: APP_NAME,
  });
  return `nmap://route/public?${params.toString()}`;
}

/** 네이버 지도 웹 대중교통 길찾기 URL */
export function buildNaverDirectionsWebUrl(pool: DirectionsPool): string {
  const destination = `${pool.lng},${pool.lat},${encodeURIComponent(pool.name)},PLACE_POI`;
  return `https://map.naver.com/p/directions/-/-/-/transit/${destination}/-/transit`;
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** 모바일은 네이버 지도 앱 우선, 미실행 시 웹 폴백. 데스크톱은 웹만 연다. */
export function openNaverDirections(pool: DirectionsPool): void {
  const webUrl = buildNaverDirectionsWebUrl(pool);

  if (!isMobileDevice()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const appUrl = buildNaverDirectionsAppUrl(pool);
  let appOpened = false;

  const onVisibilityChange = () => {
    if (document.hidden) appOpened = true;
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (!appOpened) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, APP_FALLBACK_DELAY_MS);
}
