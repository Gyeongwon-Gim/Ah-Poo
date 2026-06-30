import { useEffect, useRef, useState, useCallback } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';
import { getPoolListKey } from '../utils/poolKey';
import { filterBySearchTerm } from '../utils/poolSearch';
import { enrichWithDistance } from '../utils/geo';
import { syncAppViewport } from '../utils/appViewport';
import type { Pool } from '../types/pool';
import type { PoolMapHandle } from '../components/map/PoolMap';
import type { GeoCoords, LocationStatus } from './useUserLocation';

export type { PoolMapHandle };

export type DetailOrigin = 'search' | 'favorites' | 'suggestion' | 'map';

interface OpenPoolDetailOptions {
  instant?: boolean;
  origin?: DetailOrigin;
  zoom?: number;
}

interface UseHomeInteractionsParams {
  pools: Pool[];
  userLocation: GeoCoords | null;
  locationStatus: LocationStatus;
  loading: boolean;
  error: string | null;
  favoritesOpen: boolean;
  closeFavorites: () => void;
  refreshLocation: () => Promise<GeoCoords>;
  location: Location;
  navigate: NavigateFunction;
}

/**
 * 홈 화면의 상호작용 상태 머신: 검색, 상세 시트, 즐겨찾기 시트를
 * 한곳에서 관리한다. 이 영역들은 서로를 닫고 여는 관계라 응집도를 위해 하나의 훅으로 묶었다.
 */
export function useHomeInteractions({
  pools,
  userLocation,
  locationStatus,
  loading,
  error,
  favoritesOpen,
  closeFavorites,
  refreshLocation,
  location,
  navigate,
}: UseHomeInteractionsParams) {
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [sheetInstantEnter, setSheetInstantEnter] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin | null>(null);
  const [showUserLocationMarker, setShowUserLocationMarker] = useState(false);
  const mapRef = useRef<PoolMapHandle | null>(null);

  const isSearching = Boolean(appliedSearchTerm.trim());
  const isNearbyMode =
    !isSearching && locationStatus === 'ready' && Boolean(userLocation);

  const enrichPool = useCallback(
    (pool: Pool) => enrichWithDistance(pool, userLocation),
    [userLocation],
  );

  const resolveDetailOrigin = useCallback((): DetailOrigin => {
    if (isSearching) return 'search';
    if (favoritesOpen) return 'favorites';
    if (searchActive) return 'suggestion';
    return 'map';
  }, [isSearching, favoritesOpen, searchActive]);

  const openPoolDetail = useCallback(
    (pool: Pool, { instant = false, origin, zoom }: OpenPoolDetailOptions = {}) => {
      setDetailClosing(false);
      setDetailOrigin(origin ?? resolveDetailOrigin());
      setSheetInstantEnter(instant);
      const enriched = enrichPool(pool);
      setSelectedPool(enriched);
      mapRef.current?.panToPool(enriched, zoom);
    },
    [enrichPool, resolveDetailOrigin],
  );

  useEffect(() => {
    const openPool = (location.state as { openPool?: Pool } | null)?.openPool;
    if (!openPool) return;
    openPoolDetail(openPool, { instant: true });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, openPoolDetail, navigate]);

  // 레거시 공유 링크(/?pool=<id>)는 SEO 친화 URL(/pool/:id)로 리다이렉트한다.
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current) return;

    const poolId = new URLSearchParams(location.search).get('pool');
    if (!poolId) return;

    deepLinkHandledRef.current = true;
    navigate(`/pool/${poolId}`, { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    if (favoritesOpen) {
      setInputValue('');
      setAppliedSearchTerm('');
      setSearchActive(false);
    }
  }, [favoritesOpen]);

  useEffect(() => {
    if (isSearching) closeFavorites();
  }, [isSearching, closeFavorites]);

  // 연관검색 모드에서는 .home--suggesting .pool-map 이 visibility:hidden 이 된다.
  // visibility 변화는 ResizeObserver·IntersectionObserver 가 감지하지 못해
  // 검색을 빠져나와 지도가 다시 보일 때 빈 타일이 남는다. 이때 직접 relayout 한다.
  const prevSearchActiveRef = useRef(searchActive);
  useEffect(() => {
    if (prevSearchActiveRef.current && !searchActive) {
      requestAnimationFrame(() => mapRef.current?.relayout());
    }
    prevSearchActiveRef.current = searchActive;
  }, [searchActive]);

  const handleCloseSearch = useCallback(() => {
    setInputValue('');
    setAppliedSearchTerm('');
    setSearchActive(false);
    setSelectedPool(null);
  }, []);

  const prepareMapBaselineUI = useCallback(() => {
    closeFavorites();
    setInputValue('');
    setAppliedSearchTerm('');
    setSearchActive(false);
  }, [closeFavorites]);

  const resetToMapBaseline = useCallback(() => {
    prepareMapBaselineUI();
    setSelectedPool(null);
    setDetailClosing(false);
    setDetailOrigin(null);
  }, [prepareMapBaselineUI]);

  const handleDetailBackStart = useCallback(() => {
    setDetailClosing(true);
    if (detailOrigin === 'map') {
      prepareMapBaselineUI();
    }
  }, [detailOrigin, prepareMapBaselineUI]);

  const handleDetailBack = useCallback(() => {
    setSelectedPool(null);
    setDetailClosing(false);
    setDetailOrigin(null);
  }, []);

  const handleDetailCloseStart = useCallback(() => {
    setDetailClosing(true);
    if (detailOrigin === 'map') {
      prepareMapBaselineUI();
    }
  }, [detailOrigin, prepareMapBaselineUI]);

  const handleDetailClose = useCallback(() => {
    if (detailOrigin === 'map') {
      resetToMapBaseline();
    } else {
      handleDetailBack();
    }
  }, [detailOrigin, resetToMapBaseline, handleDetailBack]);

  const handleSelectPool = useCallback(
    (pool: Pool) => {
      setSheetInstantEnter(false);
      if (
        selectedPool &&
        getPoolListKey(selectedPool) === getPoolListKey(pool)
      ) {
        if (detailOrigin === 'map') {
          resetToMapBaseline();
        } else {
          handleDetailBack();
        }
        return;
      }
      setDetailClosing(false);
      setDetailOrigin(resolveDetailOrigin());
      const enriched = enrichPool(pool);
      setSelectedPool(enriched);
      mapRef.current?.panToPool(enriched);
    },
    [
      enrichPool,
      resetToMapBaseline,
      handleDetailBack,
      resolveDetailOrigin,
      selectedPool,
      detailOrigin,
    ],
  );

  const handleActivateSearch = useCallback(() => {
    closeFavorites();
    setSearchActive(true);
  }, [closeFavorites]);

  const handleSearchFocus = useCallback(() => {
    if (!appliedSearchTerm.trim()) {
      handleActivateSearch();
    }
  }, [appliedSearchTerm, handleActivateSearch]);

  const handleDraftChange = useCallback((value: string) => {
    setInputValue(value);
    if (!value.trim()) {
      setAppliedSearchTerm('');
      setSelectedPool(null);
      setSearchActive(true);
    }
  }, []);

  const handleSubmitSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      setInputValue(trimmed);
      setAppliedSearchTerm(trimmed);
      setSearchActive(false);
      setSelectedPool(null);

      if (!trimmed) return;

      requestAnimationFrame(() => syncAppViewport());

      // 결과가 1건이면 목록 패널을 건너뛰고 상세 시트를 바로 연다.
      // origin을 'map'으로 둬야 검색 결과 패널이 뒤에 깔리지 않고,
      // 시트를 닫으면 지도 기본 상태로 복귀한다.
      const results = filterBySearchTerm(pools, trimmed);
      if (results.length === 1) {
        openPoolDetail(results[0]!, { instant: true, origin: 'map' });
      }
    },
    [pools, openPoolDetail],
  );

  const handlePickSuggestion = useCallback(
    (pool: Pool) => {
      setInputValue(pool.name);
      setAppliedSearchTerm(pool.name);
      setSearchActive(false);
      openPoolDetail(pool, { instant: true, origin: 'search' });
    },
    [openPoolDetail],
  );

  const handleRecenter = useCallback(async () => {
    try {
      const loc = await refreshLocation();
      setShowUserLocationMarker(true);
      mapRef.current?.panToUserLocation(loc);
    } catch {
      /* 위치 권한 거부/미지원 — 버튼은 유지되며 다음 클릭에 재요청한다 */
    }
  }, [refreshLocation]);

  const canRecenter = locationStatus === 'ready' && Boolean(userLocation);
  const showLocationPending =
    !loading && !error && !isSearching && locationStatus === 'pending';
  const showSearchPanel =
    isSearching &&
    !loading &&
    !error &&
    (!selectedPool || detailOrigin === 'search');
  const searchPanelBehindDetail =
    Boolean(selectedPool) && detailOrigin === 'search' && !detailClosing;
  const searchPanelRevealFromDetail =
    detailClosing && detailOrigin === 'search';
  const showFavoritesPanel =
    favoritesOpen &&
    !selectedPool &&
    !loading &&
    !error &&
    !isSearching;
  const showFavoritesSheet =
    favoritesOpen && !selectedPool && !loading && !error && !isSearching;
  const searchMode = searchActive || isSearching;

  return {
    mapRef,
    // 검색
    inputValue,
    appliedSearchTerm,
    searchActive,
    isSearching,
    searchMode,
    handleDraftChange,
    handleSubmitSearch,
    handlePickSuggestion,
    handleCloseSearch,
    handleSearchFocus,
    // 상세 시트
    selectedPool,
    setSelectedPool,
    detailOrigin,
    detailClosing,
    sheetInstantEnter,
    handleSelectPool,
    handleDetailCloseStart,
    handleDetailClose,
    handleDetailBackStart,
    handleDetailBack,
    // 위치 / 파생 플래그
    isNearbyMode,
    canRecenter,
    showLocationPending,
    showSearchPanel,
    searchPanelBehindDetail,
    searchPanelRevealFromDetail,
    showFavoritesPanel,
    showFavoritesSheet,
    handleRecenter,
    showUserLocationMarker,
  };
}
