import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocateFixed, RefreshCw } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PoolMap from '../components/map/PoolMap';
import PoolDetailSheet from '../components/map/PoolDetailSheet';
import { fetchPools } from '../services/pools';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPoolListKey } from '../utils/poolKey';
import {
  filterPoolsWithinKm,
  getDistanceKm,
  NEARBY_RADIUS_KM,
} from '../utils/geo';
import SearchResultsPanel from '../components/map/SearchResultsPanel';
import SearchSuggestions from '../components/map/SearchSuggestions';
import { useMainTab } from '../contexts/MainTabContext';
import { useFavorites } from '../hooks/useFavorites';
import { useUserLocation } from '../hooks/useUserLocation';
import { syncAppViewport } from '../utils/appViewport';
import './Home.css';

function filterBySearchTerm(pools, searchTerm) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return pools;

  return pools.filter(
    (pool) =>
      (pool.name ?? '').toLowerCase().includes(term) ||
      (pool.address ?? '').toLowerCase().includes(term) ||
      (pool.fee ?? '').toLowerCase().includes(term),
  );
}

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { favoritesOpen, closeFavorites, setFloatingNavHidden } = useMainTab();
  const { favorites } = useFavorites();
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
  const [sheetInstantEnter, setSheetInstantEnter] = useState(false);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState(null);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [favoritesDismissing, setFavoritesDismissing] = useState(false);
  const {
    location: userLocation,
    status: locationStatus,
    refreshLocation,
  } = useUserLocation();
  const mapRef = useRef(null);

  const isSearching = Boolean(appliedSearchTerm.trim());
  const isNearbyMode =
    !isSearching && locationStatus === 'ready' && userLocation;

  const loadPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPools();
      setPools(data);
    } catch (err) {
      setError(err.message ?? '수영장 목록을 불러오지 못했습니다.');
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  const mapPools = useMemo(() => {
    let result;

    if (isSearching) {
      result = filterBySearchTerm(pools, appliedSearchTerm);
    } else if (locationStatus === 'pending') {
      return [];
    } else if (isNearbyMode) {
      return filterPoolsWithinKm(pools, userLocation, NEARBY_RADIUS_KM);
    } else if (
      locationStatus === 'denied' ||
      locationStatus === 'unsupported'
    ) {
      return [];
    } else {
      result = filterBySearchTerm(pools, appliedSearchTerm);
    }

    if (userLocation && result.length > 0) {
      return result
        .map((pool) => ({
          ...pool,
          distanceKm: getDistanceKm(
            userLocation.lat,
            userLocation.lng,
            pool.lat,
            pool.lng,
          ),
        }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return result;
  }, [
    pools,
    appliedSearchTerm,
    isSearching,
    isNearbyMode,
    userLocation,
    locationStatus,
  ]);

  useEffect(() => {
    if (!selectedPool || !isSearching) return;
    const stillVisible = mapPools.some(
      (p) => getPoolListKey(p) === getPoolListKey(selectedPool),
    );
    if (!stillVisible) setSelectedPool(null);
  }, [mapPools, selectedPool, isSearching]);

  const enrichPool = useCallback(
    (pool) => {
      if (!userLocation) return pool;
      return {
        ...pool,
        distanceKm: getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          pool.lat,
          pool.lng,
        ),
      };
    },
    [userLocation],
  );

  const resolveDetailOrigin = useCallback(() => {
    if (isSearching) return 'search';
    if (favoritesOpen) return 'favorites';
    if (searchActive) return 'suggestion';
    return 'map';
  }, [isSearching, favoritesOpen, searchActive]);

  const openPoolDetail = useCallback(
    (pool, { instant = false, origin } = {}) => {
      setDetailClosing(false);
      setDetailOrigin(origin ?? resolveDetailOrigin());
      setSheetInstantEnter(instant);
      const enriched = enrichPool(pool);
      setSelectedPool(enriched);
      mapRef.current?.panToPool(enriched);
    },
    [enrichPool, resolveDetailOrigin],
  );

  useEffect(() => {
    const openPool = location.state?.openPool;
    if (!openPool) return;
    openPoolDetail(openPool, { instant: true });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state?.openPool, openPoolDetail, navigate]);

  const favoritePools = useMemo(() => {
    if (!userLocation || locationStatus !== 'ready') return favorites;

    return [...favorites]
      .map((pool) => ({
        ...pool,
        distanceKm: getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          pool.lat,
          pool.lng,
        ),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [favorites, userLocation, locationStatus]);

  const mapMarkerPools = useMemo(() => {
    let result = isSearching ? mapPools : favoritesOpen ? favoritePools : mapPools;

    if (
      selectedPool &&
      !result.some((p) => getPoolListKey(p) === getPoolListKey(selectedPool))
    ) {
      result = [...result, selectedPool];
    }

    return result;
  }, [isSearching, favoritesOpen, mapPools, favoritePools, selectedPool]);

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

      const results = filterBySearchTerm(pools, trimmed);
      if (results.length === 1) {
        openPoolDetail(results[0], { instant: true, origin: 'search' });
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
      mapRef.current?.panToUserLocation(loc);
    } catch {
      /* 위치 권한 없음 — 버튼 숨김 상태 */
    }
  }, [refreshLocation]);

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

  const handleFavoritesDismissStart = useCallback(() => {
    setFavoritesDismissing(true);
    setFloatingNavHidden(false);
  }, [setFloatingNavHidden]);

  const handleFavoritesDismiss = useCallback(() => {
    closeFavorites();
    setFavoritesDismissing(false);
  }, [closeFavorites]);

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

  return (
    <div
      className={`home home--map app-route ${showSearchPanel ? 'home--searching' : ''} ${searchActive ? 'home--suggesting' : ''} ${showFavoritesPanel ? 'home--favorites' : ''}`}
    >
      <PoolMap
        ref={mapRef}
        pools={mapMarkerPools}
        selectedPool={selectedPool}
        onSelectPool={handleSelectPool}
        userLocation={canRecenter ? userLocation : null}
        fitToUser={isNearbyMode}
      />

      {!showSearchPanel &&
        !(showFavoritesPanel && favoritesExpanded) &&
        !selectedPool &&
        canRecenter && (
        <button
          type="button"
          className="home-location-btn glassforge-glass"
          onClick={handleRecenter}
          aria-label="현재 위치로 이동"
        >
          <LocateFixed size={20} strokeWidth={1.5} />
        </button>
      )}

      {showSearchPanel && (
        <SearchResultsPanel
          pools={mapPools}
          resetKey={appliedSearchTerm}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          titlePrefix="검색 결과"
          countSuffix="건"
          emptyMessage="검색 결과가 없습니다"
          ariaLabel={`'${appliedSearchTerm}' 검색 결과`}
          reservePeekWhenEmpty
          behindDetail={searchPanelBehindDetail}
          behindDetailInstant={sheetInstantEnter && searchPanelBehindDetail}
          revealFromDetail={searchPanelRevealFromDetail}
          interactionDisabled={searchPanelBehindDetail}
        />
      )}

      {showFavoritesSheet && (
        <SearchResultsPanel
          pools={favoritePools}
          resetKey={`favorites-${favoritesOpen}-${favorites.length}`}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          titlePrefix="즐겨찾기"
          countSuffix="곳"
          emptyMessage="즐겨찾기한 수영장이 없어요"
          ariaLabel="즐겨찾기"
          reservePeekWhenEmpty
          enterFromBottom
          softSheet
          onExpandedChange={setFavoritesExpanded}
          onDismissStart={handleFavoritesDismissStart}
          onDismiss={handleFavoritesDismiss}
        />
      )}

      <div className="home-map-overlay">
        <SearchBar
          value={inputValue}
          onValueChange={handleDraftChange}
          onSearch={handleSubmitSearch}
          onActivate={handleSearchFocus}
          onClose={handleCloseSearch}
          variant="map"
          searchMode={searchMode}
        />
        {searchActive && (
          <SearchSuggestions
            draft={inputValue}
            pools={pools}
            onPick={handlePickSuggestion}
          />
        )}
      </div>

      {loading && (
        <div className="home-map-status" aria-live="polite">
          수영장 정보를 불러오는 중…
        </div>
      )}

      {showLocationPending && (
        <div className="home-map-status" aria-live="polite">
          내 위치를 확인하는 중…
        </div>
      )}

      {error && !loading && (
        <div className="home-map-status home-map-status--error" role="alert">
          <p>{error}</p>
          {!isSupabaseConfigured && (
            <p className="home-map-status__hint">
              <code>.env</code>에 Supabase 설정을 확인하세요.
            </p>
          )}
          <button type="button" className="home-retry" onClick={loadPools}>
            <RefreshCw size={16} />
            다시 시도
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        !isSearching &&
        (locationStatus === 'denied' || locationStatus === 'unsupported') && (
          <div className="home-map-status">
            <p>위치 권한이 필요합니다</p>
            <p className="home-map-status__hint">
              브라우저에서 위치를 허용하면 주변 수영장을 볼 수 있어요
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        !showLocationPending &&
        isNearbyMode &&
        mapPools.length === 0 &&
        pools.length > 0 && (
          <div className="home-map-status">
            <p>{NEARBY_RADIUS_KM}km 이내에 등록된 수영장이 없습니다</p>
            <p className="home-map-status__hint">
              검색하면 다른 지역 수영장도 찾을 수 있어요
            </p>
          </div>
        )}

      {!loading && !error && pools.length === 0 && (
        <div className="home-map-status">
          <p>등록된 수영장이 없습니다</p>
        </div>
      )}

      {selectedPool && (
        <PoolDetailSheet
          key={getPoolListKey(selectedPool)}
          pool={selectedPool}
          instantEnter={sheetInstantEnter}
          onCloseStart={handleDetailCloseStart}
          onClose={handleDetailClose}
          onBackStart={handleDetailBackStart}
          onBack={handleDetailBack}
        />
      )}
    </div>
  );
}

export default Home;
