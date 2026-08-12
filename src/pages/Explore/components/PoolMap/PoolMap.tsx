import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useMemo,
} from 'react';
import { isFlagOn } from '@/services/pools';
import { isPoolOperating } from '@/utils/poolOperating';
import { getPoolListKey } from '@/utils/poolKey';
import { computeSearchMapFit } from '@/utils/mapFit';
import { useKakaoMap } from './useKakaoMap';
import type { Pool } from '@/types/pool';
import type { GeoCoords } from '@/pages/Explore/hooks/useUserLocation';
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
  const classes = ['pool-marker-icon'];
  if (isFlagOn(pool?.is50m)) classes.push('pool-marker-icon--50m');
  if (isPoolOperating(pool)) classes.push('pool-marker-icon--operating');
  button.className = classes.join(' ');

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

const PoolMap = forwardRef<PoolMapHandle, PoolMapProps>(
  (
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
  ) => {
    const { mapRef, map, ready, error: sdkError, relayout } = useKakaoMap({
      initialCenter: fitToUser && userLocation ? userLocation : DEFAULT_CENTER,
      initialLevel: fitToUser && userLocation ? USER_ZOOM_LEVEL : DEFAULT_LEVEL,
    });

    const markerStoreRef = useRef(new Map<string, MarkerEntry>());
    const userLocationOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
    const onSelectPoolRef = useRef(onSelectPool);
    const syncedPoolsSignatureRef = useRef('');
    const fittedPoolsSignatureRef = useRef('');
    const userLocatedRef = useRef(false);

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

    const panToUserLocation = (
      coords?: GeoCoords | null,
      level: number | null = USER_ZOOM_LEVEL,
    ) => {
      const target = coords ?? userLocation;
      if (!map || !target || !window.kakao) return false;

      const pos = new window.kakao.maps.LatLng(target.lat, target.lng);
      map.panTo(pos);
      if (level != null) map.setLevel(level);
      return true;
    };

    const panToPool = (pool: Pool, level?: number) => {
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
        relayout,
      }),
      [map, userLocation, relayout],
    );

    // 최초 사용자 위치로 1회 이동
    useEffect(() => {
      if (!map || !fitToUser || !userLocation || userLocatedRef.current) return;
      if (!window.kakao) return;

      userLocatedRef.current = true;
      panToUserLocation(null, pools.length === 0 ? USER_ZOOM_LEVEL : null);
    }, [map, fitToUser, userLocation, pools.length]);

    // 사용자 위치 마커(파란 점)
    useEffect(() => {
      if (!map || !window.kakao) return;

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
    }, [map, userLocationMarker]);

    // 수영장 마커 동기화 (추가/삭제)
    useEffect(() => {
      if (!map || !window.kakao) return;
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
    }, [map, poolsSignature, pools]);

    // 줌 레벨에 따른 라벨 노출
    useEffect(() => {
      if (!map || !window.kakao) return;

      const { kakao } = window;
      const onZoomChanged = () => {
        syncMarkerLabelVisibility(map, markerStoreRef.current);
      };

      kakao.maps.event.addListener(map, 'zoom_changed', onZoomChanged);
      onZoomChanged();

      return () => {
        kakao.maps.event.removeListener(map, 'zoom_changed', onZoomChanged);
      };
    }, [map]);

    // 선택된 마커 하이라이트
    useEffect(() => {
      for (const [key, { iconOverlay, iconEl, label, labelEl }] of markerStoreRef.current) {
        const isSelected = key === selectedKey;
        iconOverlay.setZIndex(isSelected ? 2 : 1);
        label?.setZIndex(isSelected ? 3 : 1);
        iconEl.classList.toggle('pool-marker-icon--selected', isSelected);
        labelEl?.classList.toggle('pool-marker-label--selected', isSelected);
      }
    }, [selectedKey]);

    // 목록 변경 시 지도 시점을 결과에 맞춤
    useEffect(() => {
      if (!map || !window.kakao) return;
      if (poolsSignature === fittedPoolsSignatureRef.current) return;

      fittedPoolsSignatureRef.current = poolsSignature;
      const { kakao } = window;

      // setBounds/setLevel은 지도 컨테이너의 현재 크기를 기준으로 줌·중심을 계산한다.
      // fit 직전에 내부 뷰포트를 실제 컨테이너 크기에 동기화해, 크기가 확정되기 전
      // 계산되어 엉뚱한 곳으로 가는 것을 막는다.
      relayout();

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
    }, [map, poolsSignature, pools, fitToUser, userLocation, fitMode, searchTerm, relayout]);

    // 선택된 수영장으로 부드럽게 이동
    useEffect(() => {
      if (!map || !selectedPool || !window.kakao) return;

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
    }, [map, selectedPool]);

    // 언마운트 시 마커 정리 (지도 인스턴스 정리는 useKakaoMap이 담당)
    useEffect(() => {
      const store = markerStoreRef.current;
      return () => {
        const { kakao } = window;
        userLocationOverlayRef.current?.setMap(null);
        userLocationOverlayRef.current = null;
        if (kakao?.maps) {
          for (const [, entry] of store) {
            entry.iconEl.removeEventListener('click', entry.onClick);
            entry.iconOverlay.setMap(null);
            entry.label?.setMap(null);
          }
        }
        store.clear();
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
  },
);
PoolMap.displayName = 'PoolMap';

export default memo(PoolMap);
