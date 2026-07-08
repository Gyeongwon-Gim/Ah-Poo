import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useKakaoMapLoader } from '@/hooks/useKakaoMapLoader';
import { attachMapInertia } from '@/utils/mapInertia';
import type { GeoCoords } from '@/hooks/useUserLocation';

/**
 * 지도의 "생명주기"(로드 → 컨테이너 크기 준비 → 인스턴스 생성 → relayout 유지 → 관성)를
 * 한 곳에 격리한 훅. PoolMap 컴포넌트는 이 훅이 돌려주는 map 인스턴스로
 * "무엇을 그릴지"(마커·카메라·사용자 위치)에만 집중한다.
 *
 * 반환 타입 KakaoMapController가 곧 벤더 교체 이음새다.
 * 동일한 형태의 useNaverMap을 만들면 이 훅만 갈아끼우면 된다.
 */

function syncMapLayout(
  mapEl: HTMLDivElement | null,
  map: kakao.maps.Map | null,
) {
  if (!mapEl) return;

  const shell = mapEl.closest('.pool-map') as HTMLElement | null;
  if (shell) {
    shell.style.height = '';
    shell.style.top = '';
    shell.style.bottom = '';
  }

  mapEl.style.width = '100%';
  mapEl.style.height = '100%';
  map?.relayout();
}

function refreshMapTiles(map: kakao.maps.Map | null) {
  if (!map) return;
  const center = map.getCenter?.();
  if (center) map.setCenter(center);
}

function scheduleMapRelayout(
  map: kakao.maps.Map,
  mapEl: HTMLDivElement | null,
) {
  const run = () => {
    syncMapLayout(mapEl, map);
    map.relayout();
    refreshMapTiles(map);
  };
  run();

  // 생성/마운트 직후 레이아웃이 한 프레임 뒤 확정되는 경우를 위해 한 번 더.
  // 이후의 실제 크기 변화는 ResizeObserver가 정확히 잡으므로, 예전의
  // [0,50,200,500]ms 타이머 난사는 제거한다(지연 refreshMapTiles의 setCenter가
  // 검색 panTo 애니메이션을 중단시키던 문제의 원인).
  const raf = requestAnimationFrame(run);

  return () => cancelAnimationFrame(raf);
}

export interface KakaoMapController {
  /** 지도 캔버스가 붙을 컨테이너 ref */
  mapRef: React.RefObject<HTMLDivElement>;
  /** 생성된 지도 인스턴스. 준비 전에는 null */
  map: kakao.maps.Map | null;
  /** SDK 로드 + 컨테이너 크기 준비 완료 여부 */
  ready: boolean;
  /** SDK 로드 실패 메시지 */
  error: string | null;
  /** 레이아웃 변경 시 지도 크기를 다시 맞춘다 */
  relayout: () => void;
}

interface UseKakaoMapOptions {
  /** 최초 1회 지도 생성 시의 중심 좌표 */
  initialCenter: GeoCoords;
  /** 최초 1회 지도 생성 시의 줌 레벨 */
  initialLevel: number;
}

export function useKakaoMap({
  initialCenter,
  initialLevel,
}: UseKakaoMapOptions): KakaoMapController {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const { ready, error } = useKakaoMapLoader();

  // 최초 생성값을 항상 최신으로 유지하되, 값 변경이 지도 재생성을 유발하지 않도록 ref로 보관
  const initialRef = useRef({ center: initialCenter, level: initialLevel });
  initialRef.current = { center: initialCenter, level: initialLevel };

  const relayout = useCallback(() => {
    syncMapLayout(mapRef.current, mapInstanceRef.current);
    mapInstanceRef.current?.relayout();
    refreshMapTiles(mapInstanceRef.current);
  }, []);

  // 1) 컨테이너가 실제 크기를 가지면 지도 인스턴스를 생성 (최초 1회)
  //    컨테이너 준비 감지와 생성을 한 이펙트에서 처리해, 지도가 소비자에게
  //    노출되기까지의 렌더 횟수를 1회(setMap)로 유지한다.
  //    (감지→생성을 두 이펙트로 나누면 렌더가 하나 더 끼어, 생성 시점의 relayout
  //     타이머가 이후의 panTo 애니메이션과 겹쳐 지도가 엉뚱한 곳에 멈추는 문제가 생긴다.)
  useLayoutEffect(() => {
    if (!ready || mapInstanceRef.current) return;
    const el = mapRef.current;
    if (!el) return;

    let cancelRelayout: (() => void) | null = null;
    let created: kakao.maps.Map | null = null;
    let tilesListener: (() => void) | null = null;

    const create = () => {
      if (mapInstanceRef.current) return;
      const { kakao } = window;
      const { center, level } = initialRef.current;
      const instance = new kakao.maps.Map(el, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level,
      });
      created = instance;
      mapInstanceRef.current = instance;
      setMap(instance);
      syncMapLayout(el, instance);

      tilesListener = () => {
        kakao.maps.event.removeListener(instance, 'tilesloaded', tilesListener!);
        syncMapLayout(el, instance);
        refreshMapTiles(instance);
      };
      kakao.maps.event.addListener(instance, 'tilesloaded', tilesListener);

      cancelRelayout = scheduleMapRelayout(instance, el);
    };

    let ro: ResizeObserver | null = null;
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      create();
    } else {
      ro = new ResizeObserver(() => {
        if (el.clientWidth > 0 && el.clientHeight > 0) {
          ro?.disconnect();
          create();
        }
      });
      ro.observe(el);
    }

    return () => {
      ro?.disconnect();
      cancelRelayout?.();
      if (created && tilesListener && window.kakao?.maps) {
        window.kakao.maps.event.removeListener(
          created,
          'tilesloaded',
          tilesListener,
        );
      }
    };
  }, [ready]);

  // 3) 관성 드래그 (SDK 기본 드래그는 두고, dragend 이후 감속 패닝만 얹는다)
  useEffect(() => {
    const el = mapRef.current;
    if (!map || !el || !window.kakao) return;
    return attachMapInertia(map, el);
  }, [map]);

  // 4) 뷰포트/컨테이너 변화에 맞춰 지도 크기 재조정
  useEffect(() => {
    const el = mapRef.current;
    if (!map || !el) return;

    const onResize = () => relayout();
    window.addEventListener('resize', onResize);
    window.addEventListener('screen-resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    const onVisible = () => {
      if (document.visibilityState === 'visible') relayout();
    };
    document.addEventListener('visibilitychange', onVisible);

    const shell = el.closest('.pool-map');
    const resizeObserver = new ResizeObserver(() => relayout());
    resizeObserver.observe(el);
    if (shell) resizeObserver.observe(shell);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) relayout();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(el);

    // 지도가 소비자에 노출된 직후, 컨테이너 최종 크기 기준으로 한 번 더 정렬한다.
    // (생성 이펙트의 호출만으로는 검색 panTo 중심·레벨이 틀어지는 경우가 있어 유지)
    const cancelRelayout = scheduleMapRelayout(map, el);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('screen-resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      document.removeEventListener('visibilitychange', onVisible);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      cancelRelayout();
    };
  }, [map, relayout]);

  // 5) 언마운트 시 지도 인스턴스 정리 (마커 정리는 PoolMap이 담당)
  useEffect(() => {
    return () => {
      mapInstanceRef.current = null;
      setMap(null);
      if (mapRef.current) mapRef.current.replaceChildren();
    };
  }, []);

  return { mapRef, map, ready, error, relayout };
}
