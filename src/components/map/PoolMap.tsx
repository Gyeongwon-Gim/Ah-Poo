import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useKakaoMapLoader } from '../../hooks/useKakaoMapLoader';
import { isFlagOn } from '../../services/pools';
import { getPoolListKey } from '../../utils/poolKey';
import { attachMapInertia } from '../../utils/mapInertia';
import { computeSearchMapFit } from '../../utils/mapFit';
import type { Pool } from '../../types/pool';
import type { GeoCoords } from '../../hooks/useUserLocation';
import './PoolMap.css';

interface MarkerEntry {
  iconOverlay: kakao.maps.CustomOverlay;
  iconEl: HTMLButtonElement;
  label: kakao.maps.CustomOverlay | null;
  labelEl: HTMLDivElement | null;
  pool: Pool;
  onClick: () => void;
}

export interface PoolMapHandle {
  panToPool: (pool: Pool, level?: number) => boolean;
  panToUserLocation: (coords?: GeoCoords) => boolean;
  relayout: () => void;
}

interface PoolMapProps {
  pools: Pool[];
  selectedPool: Pool | null;
  onSelectPool: (pool: Pool) => void;
  userLocation?: GeoCoords | null;
  userLocationMarker?: GeoCoords | null;
  fitToUser?: boolean;
  fitMode?: 'default' | 'search';
  searchTerm?: string;
}

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

const DEFAULT_CENTER: GeoCoords = { lat: 37.5665, lng: 126.978 };
const DEFAULT_LEVEL = 8;
const USER_ZOOM_LEVEL = 6;
const MAP_PADDING = 48;
const LABEL_VISIBLE_MAX_LEVEL = 5;

function shouldShowMarkerLabels(level: number) {
  return level <= LABEL_VISIBLE_MAX_LEVEL;
}

function syncMarkerLabelVisibility(
  map: kakao.maps.Map,
  store: Map<string, MarkerEntry>,
) {
  const showLabels = shouldShowMarkerLabels(map.getLevel());
  for (const [, { label }] of store) {
    label?.setMap(showLabels ? map : null);
  }
}

function createPoolMarkerIconEl(pool: Pool) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = isFlagOn(pool?.is50m)
    ? 'pool-marker-icon pool-marker-icon--50m'
    : 'pool-marker-icon';

  const symbol = document.createElement('span');
  symbol.className = 'pool-marker-icon__symbol material-symbols-outlined';
  symbol.textContent = 'pool';
  symbol.setAttribute('aria-hidden', 'true');

  button.appendChild(symbol);
  return button;
}

function createUserLocationMarkerEl() {
  const root = document.createElement('div');
  root.className = 'user-location-marker';
  root.setAttribute('aria-hidden', 'true');

  const pulse = document.createElement('span');
  pulse.className = 'user-location-marker__pulse';

  const dot = document.createElement('span');
  dot.className = 'user-location-marker__dot';

  root.appendChild(pulse);
  root.appendChild(dot);
  return root;
}

const PoolMap = forwardRef<PoolMapHandle, PoolMapProps>(function PoolMap(
  {
    pools,
    selectedPool,
    onSelectPool,
    userLocation,
    userLocationMarker,
    fitToUser = false,
    fitMode = 'default',
    searchTerm = '',
  },
  ref,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const markerStoreRef = useRef(new Map<string, MarkerEntry>());
  const userLocationOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const onSelectPoolRef = useRef(onSelectPool);
  const syncedPoolsSignatureRef = useRef('');
  const fittedPoolsSignatureRef = useRef('');
  const userLocatedRef = useRef(false);
  const [containerReady, setContainerReady] = useState(false);
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
    refreshMapTiles(mapInstanceRef.current);
  }, []);

  const panToUserLocation = (
    coords?: GeoCoords | null,
    level: number | null = USER_ZOOM_LEVEL,
  ) => {
    const map = mapInstanceRef.current;
    const target = coords ?? userLocation;
    if (!map || !target || !window.kakao) return false;

    const pos = new window.kakao.maps.LatLng(target.lat, target.lng);
    map.panTo(pos);
    if (level != null) map.setLevel(level);
    return true;
  };

  const panToPool = (pool: Pool, level?: number) => {
    const map = mapInstanceRef.current;
    if (!map || !pool || !window.kakao) return false;

    const pos = new window.kakao.maps.LatLng(pool.lat, pool.lng);
    map.panTo(pos);
    if (level != null) map.setLevel(level);
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      panToPool: (pool, level) => panToPool(pool, level),
      panToUserLocation: (coords) =>
        panToUserLocation(coords, USER_ZOOM_LEVEL),
      relayout: relayoutMap,
    }),
    [userLocation, ready, relayoutMap],
  );

  useLayoutEffect(() => {
    if (!ready || mapInstanceRef.current || containerReady) return;
    const el = mapRef.current;
    if (!el) return;

    if (el.clientWidth > 0 && el.clientHeight > 0) {
      setContainerReady(true);
      return;
    }

    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setContainerReady(true);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, containerReady]);

  useLayoutEffect(() => {
    if (!ready || !containerReady || !mapRef.current || mapInstanceRef.current)
      return;

    const { kakao } = window;
    const centerPoint =
      fitToUser && userLocation ? userLocation : DEFAULT_CENTER;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng),
      level: fitToUser && userLocation ? USER_ZOOM_LEVEL : DEFAULT_LEVEL,
    });
    mapInstanceRef.current = map;
    syncMapLayout(mapRef.current, map);

    const onFirstTilesLoaded = () => {
      kakao.maps.event.removeListener(map, 'tilesloaded', onFirstTilesLoaded);
      syncMapLayout(mapRef.current, map);
      refreshMapTiles(map);
    };
    kakao.maps.event.addListener(map, 'tilesloaded', onFirstTilesLoaded);

    const cancelRelayout = scheduleMapRelayout(map, mapRef.current);

    return () => {
      kakao.maps.event.removeListener(map, 'tilesloaded', onFirstTilesLoaded);
      cancelRelayout();
    };
  }, [ready, containerReady, fitToUser, userLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const el = mapRef.current;
    if (!ready || !map || !el || !window.kakao) return;

    return attachMapInertia(map, el);
  }, [ready, containerReady]);

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
  }, [ready, containerReady, relayoutMap]);

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
    panToUserLocation(
      null,
      pools.length === 0 ? USER_ZOOM_LEVEL : null,
    );
  }, [ready, fitToUser, userLocation, pools.length]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map || !window.kakao) return;

    const { kakao } = window;

    if (!userLocationMarker) {
      userLocationOverlayRef.current?.setMap(null);
      return;
    }

    const pos = new kakao.maps.LatLng(
      userLocationMarker.lat,
      userLocationMarker.lng,
    );

    if (userLocationOverlayRef.current) {
      userLocationOverlayRef.current.setPosition(pos);
      userLocationOverlayRef.current.setMap(map);
      return;
    }

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: createUserLocationMarkerEl(),
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 10,
      clickable: false,
    });
    overlay.setMap(map);
    userLocationOverlayRef.current = overlay;
  }, [ready, userLocationMarker]);

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
        entry.iconEl.removeEventListener('click', entry.onClick);
        entry.iconOverlay.setMap(null);
        entry.label?.setMap(null);
        store.delete(key);
      }
    }

    for (const pool of pools) {
      const key = getPoolListKey(pool);
      if (store.has(key)) continue;

      const pos = new kakao.maps.LatLng(pool.lat, pool.lng);
      const iconEl = createPoolMarkerIconEl(pool);
      iconEl.setAttribute('aria-label', pool.name);
      const onClick = () => onSelectPoolRef.current(pool);
      iconEl.addEventListener('click', onClick);

      const iconOverlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: iconEl,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: 1,
        clickable: true,
      });
      iconOverlay.setMap(map);

      const labelEl = document.createElement('div');
      labelEl.className = 'pool-marker-label';
      labelEl.textContent = pool.name;
      const label = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        yAnchor: 0,
        xAnchor: 0.5,
        zIndex: 1,
      });

      store.set(key, { iconOverlay, iconEl, label, labelEl, pool, onClick });
    }

    syncMarkerLabelVisibility(map, store);
  }, [ready, poolsSignature, pools]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!ready || !map || !window.kakao) return;

    const { kakao } = window;
    const onZoomChanged = () => {
      syncMarkerLabelVisibility(map, markerStoreRef.current);
    };

    kakao.maps.event.addListener(map, 'zoom_changed', onZoomChanged);
    onZoomChanged();

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', onZoomChanged);
    };
  }, [ready, containerReady]);

  useEffect(() => {
    for (const [key, { iconOverlay, iconEl, label, labelEl }] of markerStoreRef.current) {
      const isSelected = key === selectedKey;
      iconOverlay.setZIndex(isSelected ? 2 : 1);
      label?.setZIndex(isSelected ? 3 : 1);
      iconEl.classList.toggle('pool-marker-icon--selected', isSelected);
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
        panToUserLocation(userLocation, USER_ZOOM_LEVEL);
      }
      return;
    }

    if (fitMode === 'search') {
      const fit = computeSearchMapFit(pools, searchTerm);
      if (fit) {
        map.panTo(new kakao.maps.LatLng(fit.lat, fit.lng));
        map.setLevel(fit.level);
        syncMarkerLabelVisibility(map, markerStoreRef.current);
        return;
      }
    }

    const bounds = new kakao.maps.LatLngBounds();
    if (fitToUser && userLocation && fitMode !== 'search') {
      bounds.extend(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
    }
    pools.forEach((pool) => {
      bounds.extend(new kakao.maps.LatLng(pool.lat, pool.lng));
    });

    if (pools.length === 1) {
      map.panTo(new kakao.maps.LatLng(pools[0]!.lat, pools[0]!.lng));
      map.setLevel(5);
    } else {
      map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);
    }

    syncMarkerLabelVisibility(map, markerStoreRef.current);
  }, [ready, poolsSignature, pools, fitToUser, userLocation, fitMode, searchTerm]);

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
      userLocationOverlayRef.current?.setMap(null);
      userLocationOverlayRef.current = null;
      if (kakao?.maps) {
        for (const [, entry] of markerStoreRef.current) {
          entry.iconEl.removeEventListener('click', entry.onClick);
          entry.iconOverlay.setMap(null);
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
