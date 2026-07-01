import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildNaverDirectionsAppUrl,
  buildNaverDirectionsWebUrl,
  openNaverDirections,
} from './naverDirectionsUrl';

const pool = {
  name: '강남구민체육센터 수영장',
  lat: 37.4979,
  lng: 127.0276,
};

describe('buildNaverDirectionsAppUrl', () => {
  it('대중교통 앱 딥링크와 필수 파라미터를 포함한다', () => {
    const url = buildNaverDirectionsAppUrl(pool);
    const query = new URLSearchParams(url.split('?')[1]!);

    expect(url.startsWith('nmap://route/public?')).toBe(true);
    expect(query.get('dlat')).toBe('37.4979');
    expect(query.get('dlng')).toBe('127.0276');
    expect(query.get('dname')).toBe('강남구민체육센터 수영장');
    expect(query.get('appname')).toBe('https://ah-poo.kr');
  });
});

describe('buildNaverDirectionsWebUrl', () => {
  it('경도·위도 순서로 대중교통 길찾기 웹 URL을 만든다', () => {
    const url = buildNaverDirectionsWebUrl(pool);

    expect(url).toBe(
      `https://map.naver.com/p/directions/-/-/-/transit/127.0276,37.4979,${encodeURIComponent('강남구민체육센터 수영장')},PLACE_POI/-/transit`,
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

  it('모바일에서는 앱 딥링크를 먼저 시도한다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    openNaverDirections(pool);

    expect(window.location.href).toBe(buildNaverDirectionsAppUrl(pool));
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('모바일에서 앱 미실행 시 웹 URL로 폴백한다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    openNaverDirections(pool);
    vi.advanceTimersByTime(1500);

    expect(openSpy).toHaveBeenCalledWith(
      buildNaverDirectionsWebUrl(pool),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('모바일에서 앱 실행 시 폴백하지 않는다', () => {
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

    expect(openSpy).not.toHaveBeenCalled();
  });
});
