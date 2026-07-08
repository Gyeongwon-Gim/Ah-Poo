import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_URL } from '@/components/SeoHead';
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

const NAVER_MAP_IOS_STORE = 'https://itunes.apple.com/app/id311867728?mt=8';

describe('buildNaverDirectionsAppUrl', () => {
  it('통합 검색 앱 딥링크와 필수 파라미터를 포함한다', () => {
    const url = buildNaverDirectionsAppUrl(pool);
    const query = new URLSearchParams(url.split('?')[1]!);

    expect(url.startsWith('nmap://search?')).toBe(true);
    expect(query.get('query')).toBe('강남구민체육센터 수영장');
    expect(query.get('appname')).toBe(SITE_URL);
  });
});

describe('buildNaverDirectionsAndroidIntentUrl', () => {
  it('Intent URL과 Android suffix를 포함한다', () => {
    const url = buildNaverDirectionsAndroidIntentUrl(pool);

    expect(url.startsWith('intent://search?')).toBe(true);
    expect(url).toContain('query=');
    expect(url).toContain('appname=');
    expect(url.endsWith(
      '#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end',
    )).toBe(true);
  });
});

describe('buildNaverDirectionsWebUrl', () => {
  it('수영장 이름으로 웹 통합 검색 URL을 만든다', () => {
    const url = buildNaverDirectionsWebUrl(pool);

    expect(url).toBe(
      `https://map.naver.com/p/search/${encodeURIComponent('강남구민체육센터 수영장')}`,
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
