import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';
import { getPoolListKey } from '../utils/poolKey';
import { filterBySearchTerm } from '../utils/poolSearch';
import { enrichWithDistance } from '../utils/geo';
import { syncAppViewport } from '../utils/appViewport';

/** 딥링크 진입 시 해당 수영장으로 확대할 카카오맵 줌 레벨 (작을수록 확대) */
const DEEPLINK_ZOOM_LEVEL = 5;

/**
 * 홈 화면의 상호작용 상태 머신: 검색, 상세 시트, 즐겨찾기 시트, 플로팅 네비 숨김을
 * 한곳에서 관리한다. 이 세 영역은 같은 setter를 공유하며 서로를 닫고 여는 관계라
 * 응집도를 위해 하나의 훅으로 묶었다.
 */
export function useHomeInteractions({
  pools,
  userLocation,
  locationStatus,
  loading,
  error,
  favoritesOpen,
  closeFavorites,
  setFloatingNavHidden,
  refreshLocation,
  location,
  navigate,
}) {
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [sheetInstantEnter, setSheetInstantEnter] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState(null);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [favoritesDismissing, setFavoritesDismissing] = useState(false);
  const [showUserLocationMarker, setShowUserLocationMarker] = useState(false);
  const mapRef = useRef(null);

  const isSearching = Boolean(appliedSearchTerm.trim());
  const isNearbyMode =
    !isSearching && locationStatus === 'ready' && userLocation;

  const enrichPool = useCallback(
    (pool) => enrichWithDistance(pool, userLocation),
    [userLocation],
  );

  const resolveDetailOrigin = useCallback(() => {
    if (isSearching) return 'search';
    if (favoritesOpen) return 'favorites';
    if (searchActive) return 'suggestion';
    return 'map';
  }, [isSearching, favoritesOpen, searchActive]);

  const openPoolDetail = useCallback(
    (pool, { instant = false, origin, zoom } = {}) => {
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
    const openPool = location.state?.openPool;
    if (!openPool) return;
    openPoolDetail(openPool, { instant: true });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.openPool, openPoolDetail, navigate]);

  // 공유 딥링크(/?pool=<id>)로 유입된 경우: 목록 로딩이 끝난 뒤 한 번만
  // 해당 수영장 시트를 열고, 파라미터는 즉시 제거해 이후엔 평범한 세션처럼
  // 동작하게 한다. (origin: 'map' → 닫아도 그 위치에 지도가 머무름)
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (loading) return;

    const poolId = new URLSearchParams(location.search).get('pool');
    deepLinkHandledRef.current = true;

    if (!poolId) return;

    const target = pools.find((pool) => String(pool.id) === poolId);
    if (target) {
      openPoolDetail(target, {
        instant: true,
        origin: 'map',
        zoom: DEEPLINK_ZOOM_LEVEL,
      });
    }

    navigate(location.pathname, { replace: true });
  }, [
    loading,
    pools,
    location.search,
    location.pathname,
    openPoolDetail,
    navigate,
  ]);

  useEffect(() => {
    if (favoritesOpen) {
      setInputValue('');
      setAppliedSearchTerm('');
      setSearchActive(false);
    } else {
      setFavoritesExpanded(false);
      setFavoritesDismissing(false);
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
      setFloatingNavHidden(false);
    }
  }, [detailOrigin, prepareMapBaselineUI, setFloatingNavHidden]);

  const handleDetailBack = useCallback(() => {
    setSelectedPool(null);
    setDetailClosing(false);
    setDetailOrigin(null);
  }, []);

  const handleDetailCloseStart = useCallback(() => {
    setDetailClosing(true);
    if (detailOrigin === 'map') {
      prepareMapBaselineUI();
      setFloatingNavHidden(false);
    }
  }, [detailOrigin, prepareMapBaselineUI, setFloatingNavHidden]);

  const handleDetailClose = useCallback(() => {
    if (detailOrigin === 'map') {
      resetToMapBaseline();
    } else {
      handleDetailBack();
    }
  }, [detailOrigin, resetToMapBaseline, handleDetailBack]);

  const handleSelectPool = useCallback(
    (pool) => {
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

  const handleDraftChange = useCallback((value) => {
    setInputValue(value);
    if (!value.trim()) {
      setAppliedSearchTerm('');
      setSelectedPool(null);
      setSearchActive(true);
    }
  }, []);

  const handleSubmitSearch = useCallback(
    (term) => {
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
        openPoolDetail(results[0], { instant: true, origin: 'map' });
      }
    },
    [pools, openPoolDetail],
  );

  const handlePickSuggestion = useCallback(
    (pool) => {
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

  const handleFavoritesDismissStart = useCallback(() => {
    setFavoritesDismissing(true);
    setFloatingNavHidden(false);
  }, [setFloatingNavHidden]);

  const handleFavoritesDismiss = useCallback(() => {
    closeFavorites();
    setFavoritesDismissing(false);
  }, [closeFavorites]);

  const canRecenter = locationStatus === 'ready' && userLocation;
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
    !favoritesDismissing &&
    !selectedPool &&
    !loading &&
    !error &&
    !isSearching;
  const showFavoritesSheet =
    favoritesOpen && !selectedPool && !loading && !error && !isSearching;
  const searchMode = searchActive || isSearching;

  useLayoutEffect(() => {
    if (isSearching || searchActive) {
      setFloatingNavHidden(true);
    } else if (Boolean(selectedPool) && !detailClosing) {
      setFloatingNavHidden(true);
    } else if (showFavoritesSheet && !favoritesDismissing) {
      setFloatingNavHidden(true);
    } else {
      setFloatingNavHidden(false);
    }
  }, [
    isSearching,
    searchActive,
    selectedPool,
    detailClosing,
    showFavoritesSheet,
    favoritesDismissing,
    setFloatingNavHidden,
  ]);

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
    // 즐겨찾기
    favoritesExpanded,
    setFavoritesExpanded,
    favoritesDismissing,
    handleFavoritesDismissStart,
    handleFavoritesDismiss,
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
