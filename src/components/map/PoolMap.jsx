import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useKakaoMapLoader } from '../../hooks/useKakaoMapLoader';
import { getPoolListKey } from '../../utils/poolKey';
import './PoolMap.css';

function syncMapLayout(mapEl, map) {
  if (!mapEl) return;

  const shell = mapEl.closest('.pool-map');
  if (shell) {
    shell.style.height = '';
    shell.style.top = '';
    shell.style.bottom = '';
  }

  mapEl.style.width = '100%';
  mapEl.style.height = '100%';
  map?.relayout();
}

function scheduleMapRelayout(map, mapEl) {
  if (!map) return () => {};

  const run = () => {
    syncMapLayout(mapEl, map);
    map.relayout();
  };
  run();

  let raf2 = 0;
  const raf1 = requestAnimationFrame(() => {
    run();
    raf2 = requestAnimationFrame(run);
  });

  const timers = [0, 50, 200, 500].map((ms) => window.setTimeout(run, ms));

  return () => {
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    timers.forEach((id) => window.clearTimeout(id));
  };
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 8;
const USER_ZOOM_LEVEL = 6;
const MAP_PADDING = 48;

const PoolMap = forwardRef(function PoolMap(
  { pools, selectedPool, onSelectPool, userLocation, fitToUser = false },
  ref,
) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerStoreRef = useRef(new Map());
  const onSelectPoolRef = useRef(onSelectPool);
  const syncedPoolsSignatureRef = useRef('');
  const fittedPoolsSignatureRef = useRef('');
  const userLocatedRef = useRef(false);
  const { ready, error: sdkError } = useKakaoMapLoader();

  onSelectPoolRef.current = onSelectPool;

  const poolsSignature = useMemo(
    () =>
      pools
        .map((p) => getPoolListKey(p))
        .sort()
        .join('|'),
    [pools],
  );

  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const relayoutMap = useCallback(() => {
    syncMapLayout(mapRef.current, mapInstanceRef.current);
    mapInstanceRef.current?.relayout();
  }, []);

  const panToUserLocation = (coords, level = USER_ZOOM_LEVEL) => {
    const map = mapInstanceRef.current;
    const target = coords ?? userLocation;
    if (!map || !target || !window.kakao) return false;

    const pos = new window.kakao.maps.LatLng(target.lat, target.lng);
    map.panTo(pos);
    if (level != null) map.setLevel(level);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      panToUserLocation: (coords) => panToUserLocation(coords, USER_ZOOM_LEVEL),
      relayout: relayoutMap,
    }),
    [userLocation, ready, relayoutMap],
  );

  useLayoutEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    const { kakao } = window;
    const centerPoint =
      fitToUser && userLocation ? userLocation : DEFAULT_CENTER;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng),
      level: fitToUser && userLocation ? USER_ZOOM_LEVEL : DEFAULT_LEVEL,
    });
    mapInstanceRef.current = map;
    syncMapLayout(mapRef.current, map);

    return scheduleMapRelayout(map, mapRef.current);
  }, [ready, fitToUser, userLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const el = mapRef.current;
    if (!ready || !map || !el) return;

    const onResize = () => relayoutMap();
    window.addEventListener('resize', onResize);
    window.addEventListener('screen-resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);

    const onVisible = () => {
      if (document.visibilityState === 'visible') relayoutMap();
    };
    document.addEventListener('visibilitychange', onVisible);

    const shell = el.closest('.pool-map');
    const resizeObserver = new ResizeObserver(() => relayoutMap());
    resizeObserver.observe(el);
    if (shell) resizeObserver.observe(shell);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) relayoutMap();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(el);

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
  }, [ready, relayoutMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (
      !ready ||
      !map ||
      !fitToUser ||
      !userLocation ||
      userLocatedRef.current
    ) {
      return;
    }
    if (!window.kakao) return;

    userLocatedRef.current = true;
    panToUserLocation(pools.length === 0 ? USER_ZOOM_LEVEL : null);
  }, [ready, fitToUser, userLocation, pools.length]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map || !window.kakao) return;
    if (poolsSignature === syncedPoolsSignatureRef.current) return;

    syncedPoolsSignatureRef.current = poolsSignature;
    const { kakao } = window;
    const store = markerStoreRef.current;
    const nextKeys = new Set(pools.map((p) => getPoolListKey(p)));

    for (const [key, entry] of store) {
      if (!nextKeys.has(key)) {
        kakao.maps.event.removeListener(entry.marker, 'click', entry.onClick);
        entry.marker.setMap(null);
        entry.label?.setMap(null);
        store.delete(key);
      }
    }

    for (const pool of pools) {
      const key = getPoolListKey(pool);
      if (store.has(key)) continue;

      const pos = new kakao.maps.LatLng(pool.lat, pool.lng);
      const marker = new kakao.maps.Marker({ position: pos, map });
      const onClick = () => onSelectPoolRef.current(pool);
      kakao.maps.event.addListener(marker, 'click', onClick);

      const labelEl = document.createElement('div');
      labelEl.className = 'pool-marker-label';
      labelEl.textContent = pool.name;
      const label = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        yAnchor: 0,
        zIndex: 1,
      });
      label.setMap(map);

      store.set(key, { marker, label, labelEl, pool, onClick });
    }
  }, [ready, poolsSignature, pools]);

  useEffect(() => {
    for (const [key, { marker, label, labelEl }] of markerStoreRef.current) {
      const isSelected = key === selectedKey;
      marker.setZIndex(isSelected ? 2 : 1);
      label?.setZIndex(isSelected ? 3 : 1);
      labelEl?.classList.toggle('pool-marker-label--selected', isSelected);
    }
  }, [selectedKey]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map || !window.kakao) return;
    if (poolsSignature === fittedPoolsSignatureRef.current) return;

    fittedPoolsSignatureRef.current = poolsSignature;
    const { kakao } = window;

    if (pools.length === 0) {
      if (fitToUser && userLocation) {
        panToUserLocation(USER_ZOOM_LEVEL);
      }
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    if (fitToUser && userLocation) {
      bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
    }
    pools.forEach((pool) => {
      bounds.extend(new kakao.maps.LatLng(pool.lat, pool.lng));
    });

    if (pools.length === 1) {
      map.panTo(new kakao.maps.LatLng(pools[0].lat, pools[0].lng));
      map.setLevel(5);
    } else {
      map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);
    }
  }, [ready, poolsSignature, pools, fitToUser, userLocation]);

  // 마커 선택 시: 현재 타일 로드 후 panTo로 부드럽게 이동
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map || !selectedPool || !window.kakao) return;

    const { kakao } = window;
    const pos = new kakao.maps.LatLng(selectedPool.lat, selectedPool.lng);
    let cancelled = false;

    const panToMarker = () => {
      if (cancelled) return;
      map.panTo(pos);
    };

    const onIdle = () => {
      kakao.maps.event.removeListener(map, 'idle', onIdle);
      panToMarker();
    };

    kakao.maps.event.addListener(map, 'idle', onIdle);
    const fallback = window.setTimeout(panToMarker, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      kakao.maps.event.removeListener(map, 'idle', onIdle);
    };
  }, [ready, selectedPool]);

  useEffect(() => {
    return () => {
      const { kakao } = window;
      if (kakao?.maps) {
        for (const [, entry] of markerStoreRef.current) {
          kakao.maps.event.removeListener(entry.marker, 'click', entry.onClick);
          entry.marker.setMap(null);
          entry.label?.setMap(null);
        }
      }
      markerStoreRef.current.clear();
      mapInstanceRef.current = null;
      syncedPoolsSignatureRef.current = '';
      fittedPoolsSignatureRef.current = '';
      userLocatedRef.current = false;
      if (mapRef.current) mapRef.current.replaceChildren();
    };
  }, []);

  return (
    <div className="pool-map">
      {(sdkError || !ready) && (
        <div
          className={`pool-map__status ${
            sdkError ? 'pool-map--error' : 'pool-map--loading'
          }`}
          aria-live="polite"
        >
          <p>{sdkError ?? '지도를 불러오는 중…'}</p>
        </div>
      )}
      <div
        ref={mapRef}
        className="pool-map__canvas"
        aria-hidden={!ready || Boolean(sdkError)}
      />
    </div>
  );
});

export default memo(PoolMap);
