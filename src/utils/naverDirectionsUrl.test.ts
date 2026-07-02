import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_URL } from '../components/SeoHead';
import {
  buildNaverDirectionsAndroidIntentUrl,
  buildNaverDirectionsAppUrl,
  buildNaverDirectionsWebUrl,
  openNaverDirections,
} from './naverDirectionsUrl';

const pool = {
  name: '강남구민체육센터 수영장',
  lat: 37.4979,
  lng: 127.0276,
};

const origin = {
  lat: 37.5,
  lng: 127.0,
  name: '현재 위치',
};

const NAVER_MAP_IOS_STORE = 'https://itunes.apple.com/app/id311867728?mt=8';

describe('buildNaverDirectionsAppUrl', () => {
  it('대중교통 앱 딥링크와 필수 파라미터를 포함한다', () => {
    const url = buildNaverDirectionsAppUrl(pool);
    const query = new URLSearchParams(url.split('?')[1]!);

    expect(url.startsWith('nmap://route/public?')).toBe(true);
    expect(query.get('dlat')).toBe('37.4979');
    expect(query.get('dlng')).toBe('127.0276');
    expect(query.get('dname')).toBe('강남구민체육센터 수영장');
    expect(query.get('appname')).toBe(SITE_URL);
  });

  it('출발지가 있으면 slat/slng/sname을 포함한다', () => {
    const url = buildNaverDirectionsAppUrl(pool, origin);
    const query = new URLSearchParams(url.split('?')[1]!);

    expect(query.get('slat')).toBe('37.5');
    expect(query.get('slng')).toBe('127');
    expect(query.get('sname')).toBe('현재 위치');
  });
});

describe('buildNaverDirectionsAndroidIntentUrl', () => {
  it('Intent URL과 Android suffix를 포함한다', () => {
    const url = buildNaverDirectionsAndroidIntentUrl(pool);

    expect(url.startsWith('intent://route/public?')).toBe(true);
    expect(url).toContain('appname=');
    expect(url.endsWith(
      '#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end',
    )).toBe(true);
  });
});

describe('buildNaverDirectionsWebUrl', () => {
  it('경도·위도 순서로 대중교통 길찾기 웹 URL을 만든다', () => {
    const url = buildNaverDirectionsWebUrl(pool);

    expect(url).toBe(
      `https://map.naver.com/p/directions/-/-/transit/127.0276,37.4979,${encodeURIComponent('강남구민체육센터 수영장')},PLACE_POI/-/transit`,
    );
  });

  it('출발지가 있으면 출발 슬롯을 채운다', () => {
    const url = buildNaverDirectionsWebUrl(pool, origin);

    expect(url).toBe(
      `https://map.naver.com/p/directions/127,37.5,${encodeURIComponent('현재 위치')},PLACE_POI/-/transit/127.0276,37.4979,${encodeURIComponent('강남구민체육센터 수영장')},PLACE_POI/-/transit`,
    );
  });
});

describe('openNaverDirections', () => {
  const openSpy = vi.fn();
  let originalUserAgent: string;

  beforeEach(() => {
    vi.useFakeTimers();
    originalUserAgent = navigator.userAgent;
    openSpy.mockReset();
    vi.stubGlobal('open', openSpy);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
      writable: true,
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it('데스크톱에서는 웹 URL만 새 탭으로 연다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    });

    openNaverDirections(pool);

    expect(openSpy).toHaveBeenCalledWith(
      buildNaverDirectionsWebUrl(pool),
      '_blank',
      'noopener,noreferrer',
    );
    expect(window.location.href).toBe('');
  });

  it('Android에서는 Intent URL을 연다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14)',
    });

    openNaverDirections(pool);

    expect(window.location.href).toBe(
      buildNaverDirectionsAndroidIntentUrl(pool),
    );
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('iOS에서는 nmap 딥링크를 먼저 시도한다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    openNaverDirections(pool);

    expect(window.location.href).toBe(buildNaverDirectionsAppUrl(pool));
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('iOS에서 앱 미실행 시 App Store로 폴백한다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    openNaverDirections(pool);
    vi.advanceTimersByTime(1500);

    expect(window.location.href).toBe(NAVER_MAP_IOS_STORE);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('iOS에서 앱 실행 시 폴백하지 않는다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    openNaverDirections(pool);
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1500);

    expect(window.location.href).toBe(buildNaverDirectionsAppUrl(pool));
    expect(openSpy).not.toHaveBeenCalled();
  });
});
