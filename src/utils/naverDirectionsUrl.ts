import { SITE_URL } from '../components/SeoHead';
import type { Pool } from '../types/pool';

const NAVER_MAP_IOS_STORE = 'https://itunes.apple.com/app/id311867728?mt=8';
const ANDROID_INTENT_SUFFIX =
  '#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end';
const APP_FALLBACK_DELAY_MS = 1500;

type DirectionsDestination = Pick<Pool, 'name' | 'lat' | 'lng'>;

export type DirectionsOrigin = {
  lat: number;
  lng: number;
  name?: string;
};

export type OpenDirectionsOptions = {
  origin?: DirectionsOrigin | null;
};

function buildRoutePublicQuery(
  dest: DirectionsDestination,
  origin?: DirectionsOrigin | null,
): string {
  const params = new URLSearchParams({
    dlat: String(dest.lat),
    dlng: String(dest.lng),
    dname: dest.name,
    appname: SITE_URL,
  });

  if (origin) {
    params.set('slat', String(origin.lat));
    params.set('slng', String(origin.lng));
    if (origin.name) {
      params.set('sname', origin.name);
    }
  }

  return params.toString();
}

/** 네이버 지도 앱 대중교통 길찾기 URL (nmap://) */
export function buildNaverDirectionsAppUrl(
  dest: DirectionsDestination,
  origin?: DirectionsOrigin | null,
): string {
  return `nmap://route/public?${buildRoutePublicQuery(dest, origin)}`;
}

/** Android Intent URL — 앱 미설치 시 Google Play로 자동 이동 */
export function buildNaverDirectionsAndroidIntentUrl(
  dest: DirectionsDestination,
  origin?: DirectionsOrigin | null,
): string {
  return `intent://route/public?${buildRoutePublicQuery(dest, origin)}${ANDROID_INTENT_SUFFIX}`;
}

function formatWebPoi(lng: number, lat: number, name: string): string {
  return `${lng},${lat},${encodeURIComponent(name)},PLACE_POI`;
}

/** 네이버 지도 웹 대중교통 길찾기 URL */
export function buildNaverDirectionsWebUrl(
  dest: DirectionsDestination,
  origin?: DirectionsOrigin | null,
): string {
  const destination = formatWebPoi(dest.lng, dest.lat, dest.name);
  const from = origin
    ? formatWebPoi(origin.lng, origin.lat, origin.name ?? '현재 위치')
    : '-';

  return `https://map.naver.com/p/directions/${from}/-/transit/${destination}/-/transit`;
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobileDevice(): boolean {
  return isAndroid() || isIOS();
}

/** 데스크톱은 웹, Android는 Intent, iOS는 앱 우선·미실행 시 App Store */
export function openNaverDirections(
  dest: DirectionsDestination,
  options?: OpenDirectionsOptions,
): void {
  const origin = options?.origin ?? null;
  const webUrl = buildNaverDirectionsWebUrl(dest, origin);

  if (!isMobileDevice()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (isAndroid()) {
    window.location.href = buildNaverDirectionsAndroidIntentUrl(dest, origin);
    return;
  }

  const appUrl = buildNaverDirectionsAppUrl(dest, origin);
  let appOpened = false;

  const onVisibilityChange = () => {
    if (document.hidden) appOpened = true;
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (!appOpened) {
      window.location.href = NAVER_MAP_IOS_STORE;
    }
  }, APP_FALLBACK_DELAY_MS);
}
