import { useEffect, useRef, useState, useCallback } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';
import { fetchPoolById } from '@/services/pools';
import { getPoolListKey } from '@/utils/poolKey';
import { filterBySearchTerm } from '@/utils/poolSearch';
import { enrichWithDistance } from '@/utils/geo';
import { syncAppViewport } from '@/utils/appViewport';
import type { Pool } from '@/types/pool';
import type { PoolMapHandle } from '@/pages/Explore/components/PoolMap';
import type { GeoCoords, LocationStatus } from './useUserLocation';

export type { PoolMapHandle };

export type DetailOrigin =
  | 'search'
  | 'favorites'
  | 'nearby'
  | '50m'
  | 'suggestion'
  | 'map';

interface OpenPoolDetailOptions {
  instant?: boolean;
  origin?: DetailOrigin;
  zoom?: number;
}

interface UseExploreInteractionsParams {
  pools: Pool[];
  userLocation: GeoCoords | null;
  locationStatus: LocationStatus;
  loading: boolean;
  error: string | null;
  favoritesOpen: boolean;
  closeFavorites: () => void;
  nearbyOpen: boolean;
  closeNearby: () => void;
  refreshLocation: () => Promise<GeoCoords>;
  location: Location;
  navigate: NavigateFunction;
}

/**
 * 홈 화면의 상호작용 상태 머신: 검색, 상세 시트, 즐겨찾기·주변 시트를
 * 한곳에서 관리한다. 이 영역들은 서로를 닫고 여는 관계라 응집도를 위해 하나의 훅으로 묶었다.
 */
export function useExploreInteractions({
  pools,
  userLocation,
  locationStatus,
  loading,
  error,
  favoritesOpen,
  closeFavorites,
  nearbyOpen,
  closeNearby,
  refreshLocation,
  location,
  navigate,
}: UseExploreInteractionsParams) {
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [sheetInstantEnter, setSheetInstantEnter] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin | null>(null);
  const [showUserLocationMarker, setShowUserLocationMarker] = useState(false);
  const [show50mOnly, setShow50mOnly] = useState(false);
  const mapRef = useRef<PoolMapHandle | null>(null);

  const isSearching = Boolean(appliedSearchTerm.trim());
  const isNearbyMode =
    nearbyOpen &&
    !isSearching &&
    locationStatus === 'ready' &&
    Boolean(userLocation);

  const enrichPool = useCallback(
    (pool: Pool) => enrichWithDistance(pool, userLocation),
    [userLocation],
  );

  const resolveDetailOrigin = useCallback((): DetailOrigin => {
    if (isSearching) return 'search';
    if (favoritesOpen) return 'favorites';
    if (nearbyOpen) return 'nearby';
    if (show50mOnly) return '50m';
    if (searchActive) return 'suggestion';
    return 'map';
  }, [isSearching, favoritesOpen, nearbyOpen, show50mOnly, searchActive]);

  const openPoolDetail = useCallback(
    (
      pool: Pool,
      { instant = false, origin, zoom }: OpenPoolDetailOptions = {},
    ) => {
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

  // 공유 링크(/?pool=<id>)로 진입하면 지도에서 상세 시트를 연다.
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || loading) return;

    const poolId = new URLSearchParams(location.search).get('pool');
    if (!poolId) return;

    deepLinkHandledRef.current = true;

    const openFromDeepLink = async () => {
      const fromList = pools.find((p) => p.id === poolId);
      const pool = fromList ?? (await fetchPoolById(poolId));
      if (pool) {
        openPoolDetail(pool, { instant: true, origin: 'map' });
      }
      navigate('/', { replace: true });
    };

    void openFromDeepLink();
  }, [location.search, loading, pools, openPoolDetail, navigate]);

  useEffect(() => {
    if (favoritesOpen || nearbyOpen) {
      setInputValue('');
      setAppliedSearchTerm('');
      setSearchActive(false);
      setShow50mOnly(false);
    }
  }, [favoritesOpen, nearbyOpen]);

  useEffect(() => {
    if (isSearching) {
      closeFavorites();
      closeNearby();
      setShow50mOnly(false);
    }
  }, [isSearching, closeFavorites, closeNearby]);

  // 연관검색 모드에서는 .explore--suggesting .pool-map 이 visibility:hidden 이 된다.
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
    setShow50mOnly(false);
    closeFavorites();
    closeNearby();
  }, [closeFavorites, closeNearby]);

  const toggle50mOnly = useCallback(() => {
    setShow50mOnly((prev) => {
      const next = !prev;
      if (next) {
        closeFavorites();
        closeNearby();
      }
      return next;
    });
  }, [closeFavorites, closeNearby]);

  const prepareMapBaselineUI = useCallback(() => {
    closeFavorites();
    closeNearby();
    setInputValue('');
    setAppliedSearchTerm('');
    setSearchActive(false);
  }, [closeFavorites, closeNearby]);

  const resetToMapBaseline = useCallback(() => {
    prepareMapBaselineUI();
    setSelectedPool(null);
    setDetailClosing(false);
    setDetailOrigin(null);
  }, [prepareMapBaselineUI]);

  // 닫기(X)/뒤로가기 버튼 모두 애니메이션 시작 시점엔 동일하게 처리한다 —
  // 시트가 슬라이드다운되는 동안 뒤에 드러나는 화면을 미리 지도 기본 상태로 맞춰둔다.
  const handleDetailDismissStart = useCallback(() => {
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
        handleDetailClose();
        return;
      }
      setDetailClosing(false);
      setDetailOrigin(resolveDetailOrigin());
      const enriched = enrichPool(pool);
      setSelectedPool(enriched);
      mapRef.current?.panToPool(enriched);
    },
    [enrichPool, handleDetailClose, resolveDetailOrigin, selectedPool],
  );

  const handleActivateSearch = useCallback(() => {
    closeFavorites();
    closeNearby();
    setShow50mOnly(false);
    setSearchActive(true);
  }, [closeFavorites, closeNearby]);

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
  const canShowBaselinePanel =
    !selectedPool && !loading && !error && !isSearching;
  const showFavoritesPanel = favoritesOpen && canShowBaselinePanel;
  const showNearbyPanel = nearbyOpen && canShowBaselinePanel;
  const show50mPanel = show50mOnly && canShowBaselinePanel;
  // 즐겨찾기·주변수영장·50m레인도 검색창을 "검색된 상태"처럼 보이게 해 뒤로가기(←) 버튼으로
  // 되돌아갈 수 있게 한다. handleCloseSearch가 closeFavorites/closeNearby/show50mOnly도 함께 호출한다.
  const searchMode =
    searchActive || isSearching || favoritesOpen || nearbyOpen || show50mOnly;

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
    handleDetailCloseStart: handleDetailDismissStart,
    handleDetailClose,
    handleDetailBackStart: handleDetailDismissStart,
    handleDetailBack,
    // 위치 / 파생 플래그
    isNearbyMode,
    canRecenter,
    showLocationPending,
    showSearchPanel,
    searchPanelBehindDetail,
    searchPanelRevealFromDetail,
    showFavoritesPanel,
    showFavoritesSheet: showFavoritesPanel,
    showNearbyPanel,
    showNearbySheet: showNearbyPanel,
    show50mPanel,
    show50mSheet: show50mPanel,
    handleRecenter,
    showUserLocationMarker,
    // 50m 레인 필터
    show50mOnly,
    toggle50mOnly,
  };
}
