import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocateFixed, Star } from 'lucide-react';
import SearchBar from '@/pages/Explore/components/SearchBar';
import { Button, FloatingPill } from '@/components';
import PoolMap from '@/pages/Explore/components/PoolMap';
import PoolDetailSheet from '@/pages/Explore/components/PoolDetailSheet';
import SearchResult from '@/pages/Explore/components/SearchResult';
import Favorites from '@/pages/Explore/components/Favorites';
import NearbyPools from '@/pages/Explore/components/NearbyPools';
import SearchSuggestions from '@/pages/Explore/components/SearchSuggestions';
import MapStatusMessage from '@/pages/Explore/components/MapStatusMessage';
import { getPoolListKey } from '@/utils/poolKey';
import { useMainTab } from '@/contexts/MainTabContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserLocation } from '@/hooks/useUserLocation';
import { usePoolData } from '@/hooks/usePoolData';
import { useMapPools } from '@/hooks/useMapPools';
import { useExploreInteractions } from '@/hooks/useExploreInteractions';
import { useMapFabLift } from '@/hooks/useMapFabLift';
import SeoHead, { buildExploreJsonLd } from '@/components/SeoHead';
import './Explore.css';

const EXPLORE_TITLE = '어푸! | 전국 일일입장·자유수영 수영장 찾기';

const SEARCH_OPEN_PILL_GAP = 10;

function Explore() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    favoritesOpen,
    closeFavorites,
    toggleFavorites,
    nearbyOpen,
    closeNearby,
    toggleNearby,
  } = useMainTab();
  const { favorites } = useFavorites();
  const [searchPanelCollapsed, setSearchPanelCollapsed] = useState(false);
  const [searchSheetTop, setSearchSheetTop] = useState(Number.POSITIVE_INFINITY);
  const [favoritesPanelCollapsed, setFavoritesPanelCollapsed] = useState(false);
  const [favoritesSheetTop, setFavoritesSheetTop] = useState(Number.POSITIVE_INFINITY);
  const [nearbyPanelCollapsed, setNearbyPanelCollapsed] = useState(false);
  const [nearbySheetTop, setNearbySheetTop] = useState(Number.POSITIVE_INFINITY);
  const reopenSearchListRef = useRef<(() => void) | null>(null);
  const reopenFavoritesListRef = useRef<(() => void) | null>(null);
  const reopenNearbyListRef = useRef<(() => void) | null>(null);
  const {
    location: userLocation,
    status: locationStatus,
    refreshLocation,
  } = useUserLocation();

  const { pools, loading, error, reload } = usePoolData();

  const interactions = useExploreInteractions({
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
  });

  const {
    mapRef,
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
    selectedPool,
    setSelectedPool,
    sheetInstantEnter,
    handleSelectPool,
    handleDetailCloseStart,
    handleDetailClose,
    handleDetailBackStart,
    handleDetailBack,
    isNearbyMode,
    canRecenter,
    showLocationPending,
    showSearchPanel,
    searchPanelBehindDetail,
    searchPanelRevealFromDetail,
    showFavoritesPanel,
    showFavoritesSheet,
    showNearbyPanel,
    showNearbySheet,
    handleRecenter,
    detailClosing,
  } = interactions;

  const showMapFabs = !searchActive && !loading && !error;

  const {
    fabInteractive,
    fabStyle,
    defaultFabBottom,
    sheetDragging,
    onSearchSheetTopChange,
    onFavoritesSheetTopChange,
    onNearbySheetTopChange,
    onDetailSheetTopChange,
    onSearchSheetDragChange,
    onFavoritesSheetDragChange,
    onNearbySheetDragChange,
    onDetailSheetDragChange,
  } = useMapFabLift({
    enabled: showMapFabs,
    detailOpen: Boolean(selectedPool) && !detailClosing,
    searchPanelOpen: showSearchPanel,
    searchPanelHidden: searchPanelBehindDetail,
    favoritesPanelOpen: showFavoritesSheet,
    nearbyPanelOpen: showNearbySheet,
  });

  const handleSearchSheetTopChange = useCallback((top: number) => {
    setSearchSheetTop(top);
    onSearchSheetTopChange(top);
  }, [onSearchSheetTopChange]);

  const handleFavoritesSheetTopChange = useCallback((top: number) => {
    setFavoritesSheetTop(top);
    onFavoritesSheetTopChange(top);
  }, [onFavoritesSheetTopChange]);

  const handleNearbySheetTopChange = useCallback((top: number) => {
    setNearbySheetTop(top);
    onNearbySheetTopChange(top);
  }, [onNearbySheetTopChange]);

  const showSearchOpenPill =
    isSearching &&
    searchPanelCollapsed &&
    !loading &&
    !error &&
    !selectedPool &&
    !favoritesOpen &&
    !nearbyOpen;

  const searchOpenPillStyle = useMemo((): CSSProperties | undefined => {
    if (!showSearchOpenPill || !Number.isFinite(searchSheetTop)) return undefined;
    const viewportH =
      typeof window !== 'undefined'
        ? (window.visualViewport?.height ?? window.innerHeight)
        : 800;
    return {
      bottom: Math.max(16, viewportH - searchSheetTop + SEARCH_OPEN_PILL_GAP),
    };
  }, [showSearchOpenPill, searchSheetTop]);

  const handleReopenSearchList = useCallback(() => {
    reopenSearchListRef.current?.();
  }, []);

  const showFavoritesOpenPill =
    favoritesOpen &&
    favoritesPanelCollapsed &&
    showFavoritesSheet &&
    !isSearching &&
    !selectedPool;

  const favoritesOpenPillStyle = useMemo((): CSSProperties | undefined => {
    if (!showFavoritesOpenPill || !Number.isFinite(favoritesSheetTop)) {
      return undefined;
    }
    const viewportH =
      typeof window !== 'undefined'
        ? (window.visualViewport?.height ?? window.innerHeight)
        : 800;
    return {
      bottom: Math.max(16, viewportH - favoritesSheetTop + SEARCH_OPEN_PILL_GAP),
    };
  }, [showFavoritesOpenPill, favoritesSheetTop]);

  const handleReopenFavoritesList = useCallback(() => {
    reopenFavoritesListRef.current?.();
  }, []);

  const showNearbyOpenPill =
    nearbyOpen &&
    nearbyPanelCollapsed &&
    showNearbySheet &&
    !isSearching &&
    !selectedPool;

  const nearbyOpenPillStyle = useMemo((): CSSProperties | undefined => {
    if (!showNearbyOpenPill || !Number.isFinite(nearbySheetTop)) {
      return undefined;
    }
    const viewportH =
      typeof window !== 'undefined'
        ? (window.visualViewport?.height ?? window.innerHeight)
        : 800;
    return {
      bottom: Math.max(16, viewportH - nearbySheetTop + SEARCH_OPEN_PILL_GAP),
    };
  }, [showNearbyOpenPill, nearbySheetTop]);

  const handleReopenNearbyList = useCallback(() => {
    reopenNearbyListRef.current?.();
  }, []);

  const showNearbyEntryPill =
    !searchActive &&
    !isSearching &&
    !loading &&
    !error &&
    !favoritesOpen &&
    !nearbyOpen &&
    !selectedPool;

  useEffect(() => {
    if (!showSearchPanel) setSearchPanelCollapsed(false);
  }, [showSearchPanel]);

  useEffect(() => {
    if (!showFavoritesSheet) setFavoritesPanelCollapsed(false);
  }, [showFavoritesSheet]);

  useEffect(() => {
    if (!showNearbySheet) setNearbyPanelCollapsed(false);
  }, [showNearbySheet]);

  const {
    mapPools,
    favoritePools,
    mapMarkerPools,
  } = useMapPools({
    pools,
    appliedSearchTerm,
    isSearching,
    isNearbyMode,
    userLocation,
    locationStatus,
    favorites,
    favoritesOpen,
    nearbyOpen,
    selectedPool,
    onResetSelected: () => setSelectedPool(null),
  });

  return (
    <div
      className={`explore explore--map app-route ${showSearchPanel ? 'explore--searching' : ''} ${searchActive ? 'explore--suggesting' : ''} ${showFavoritesPanel ? 'explore--favorites' : ''} ${showNearbyPanel ? 'explore--nearby' : ''}`}
    >
      <SeoHead title={EXPLORE_TITLE} path="/" jsonLd={buildExploreJsonLd()} />
      <PoolMap
        ref={mapRef}
        pools={mapMarkerPools}
        selectedPool={selectedPool}
        onSelectPool={handleSelectPool}
        userLocation={canRecenter ? userLocation : null}
        userLocationMarker={canRecenter ? userLocation : null}
        fitToUser={canRecenter && !isSearching}
        fitMode={isSearching ? 'search' : 'default'}
        searchTerm={appliedSearchTerm}
      />

      {!searchActive && !loading && !error && (
        <div
          className={`explore-map-actions${fabInteractive ? '' : ' explore-map-actions--inert'}${sheetDragging ? ' explore-map-actions--dragging' : ''}`}
          style={
            {
              ...fabStyle,
              '--map-fab-default-bottom': defaultFabBottom,
            } as CSSProperties
          }
          aria-hidden={!fabInteractive}
        >
          <Button
            type="button"
            variant="icon"
            favorite
            active={favoritesOpen}
            onClick={toggleFavorites}
            aria-label="즐겨찾기"
            aria-pressed={favoritesOpen}
          >
            <Star size={17} strokeWidth={1.5} fill="currentColor" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="icon"
            onClick={handleRecenter}
            aria-label="현재 위치로 이동"
          >
            <LocateFixed size={18} strokeWidth={1.5} />
          </Button>
        </div>
      )}

      {showSearchPanel && (
        <SearchResult
          pools={mapPools}
          resetKey={appliedSearchTerm}
          searchTerm={appliedSearchTerm}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          behindDetail={searchPanelBehindDetail}
          behindDetailInstant={sheetInstantEnter && searchPanelBehindDetail}
          revealFromDetail={searchPanelRevealFromDetail}
          interactionDisabled={searchPanelBehindDetail}
          onCollapsedChange={setSearchPanelCollapsed}
          reopenListRef={reopenSearchListRef}
          onTopChange={handleSearchSheetTopChange}
          onDragChange={onSearchSheetDragChange}
        />
      )}

      {showSearchOpenPill && (
        <FloatingPill
          className="explore-search-open-pill"
          style={searchOpenPillStyle}
          onClick={handleReopenSearchList}
          aria-label="목록 열기"
        />
      )}

      {showFavoritesSheet && (
        <Favorites
          pools={favoritePools}
          resetKey={`favorites-${favoritesOpen}-${favorites.length}`}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          onCollapsedChange={setFavoritesPanelCollapsed}
          reopenListRef={reopenFavoritesListRef}
          onTopChange={handleFavoritesSheetTopChange}
          onDragChange={onFavoritesSheetDragChange}
        />
      )}

      {showFavoritesOpenPill && (
        <FloatingPill
          className="explore-search-open-pill"
          style={favoritesOpenPillStyle}
          onClick={handleReopenFavoritesList}
          aria-label="목록 열기"
        />
      )}

      {showNearbySheet && (
        <NearbyPools
          pools={mapPools}
          resetKey={`nearby-${nearbyOpen}-${mapPools.length}`}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          onCollapsedChange={setNearbyPanelCollapsed}
          reopenListRef={reopenNearbyListRef}
          onTopChange={handleNearbySheetTopChange}
          onDragChange={onNearbySheetDragChange}
        />
      )}

      {showNearbyOpenPill && (
        <FloatingPill
          className="explore-search-open-pill"
          style={nearbyOpenPillStyle}
          onClick={handleReopenNearbyList}
          aria-label="목록 열기"
        />
      )}

      <div className="explore-map-overlay">
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
        {showNearbyEntryPill && (
          <div className="explore-nearby-entry">
            <FloatingPill
              className="explore-nearby-entry-pill"
              onClick={toggleNearby}
              aria-label="주변 수영장"
              icon={
                <span
                  className="explore-nearby-entry-pill__icon material-symbols-outlined"
                  aria-hidden
                >
                  pool
                </span>
              }
            >
              주변 수영장
            </FloatingPill>
          </div>
        )}
      </div>

      <MapStatusMessage
        loading={loading}
        error={error}
        onRetry={reload}
        onLocationRetry={refreshLocation}
        showLocationPending={showLocationPending}
        isSearching={isSearching}
        locationStatus={locationStatus}
        poolCount={pools.length}
      />

      {selectedPool && (
        <PoolDetailSheet
          key={getPoolListKey(selectedPool)}
          pool={selectedPool}
          instantEnter={sheetInstantEnter}
          onCloseStart={handleDetailCloseStart}
          onClose={handleDetailClose}
          onBackStart={handleDetailBackStart}
          onBack={handleDetailBack}
          onTopChange={onDetailSheetTopChange}
          onDragChange={onDetailSheetDragChange}
        />
      )}
    </div>
  );
}

export default Explore;
