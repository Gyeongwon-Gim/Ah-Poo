import { SITE_URL } from '@/components/SeoHead';
import type { Pool } from '@/types/pool';

const NAVER_MAP_IOS_STORE = 'https://itunes.apple.com/app/id311867728?mt=8';
const ANDROID_INTENT_SUFFIX =
  '#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end';
const APP_FALLBACK_DELAY_MS = 1500;

type DirectionsDestination = Pick<Pool, 'name' | 'lat' | 'lng'>;

function buildSearchQuery(name: string): string {
  return new URLSearchParams({
    query: name,
    appname: SITE_URL,
  }).toString();
}

/** 네이버 지도 앱 통합 검색 URL (nmap://) */
export function buildNaverDirectionsAppUrl(dest: DirectionsDestination): string {
  return `nmap://search?${buildSearchQuery(dest.name)}`;
}

/** Android Intent URL — 앱 미설치 시 Google Play로 자동 이동 */
export function buildNaverDirectionsAndroidIntentUrl(
  dest: DirectionsDestination,
): string {
  return `intent://search?${buildSearchQuery(dest.name)}${ANDROID_INTENT_SUFFIX}`;
}

/** 네이버 지도 웹 통합 검색 URL */
export function buildNaverDirectionsWebUrl(dest: DirectionsDestination): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(dest.name)}`;
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
export function openNaverDirections(dest: DirectionsDestination): void {
  const webUrl = buildNaverDirectionsWebUrl(dest);

  if (!isMobileDevice()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  if (isAndroid()) {
    window.location.href = buildNaverDirectionsAndroidIntentUrl(dest);
    return;
  }

  const appUrl = buildNaverDirectionsAppUrl(dest);
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
