import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocateFixed, Star } from 'lucide-react';
import SearchBar from '@/pages/Explore/components/SearchBar';
import { Button, FloatingPill, Tag } from '@/components';
import PoolMap from '@/pages/Explore/components/PoolMap';
import PoolDetailSheet from '@/pages/Explore/components/PoolDetailSheet';
import PoolListSheet from '@/pages/Explore/components/PoolListSheet';
import {
  POOL_LIST_PRESETS,
  searchResultPreset,
} from '@/pages/Explore/components/PoolListSheet/presets';
import SearchSuggestions from '@/pages/Explore/components/SearchSuggestions';
import MapStatusMessage from '@/pages/Explore/components/MapStatusMessage';
import { getPoolListKey } from '@/utils/poolKey';
import { usePoolFilter } from '@/contexts/PoolFilterContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserLocation } from '@/pages/Explore/hooks/useUserLocation';
import { usePoolData } from '@/pages/Explore/hooks/usePoolData';
import { useMapPools } from '@/pages/Explore/hooks/useMapPools';
import { useExploreInteractions } from '@/pages/Explore/hooks/useExploreInteractions';
import { useMapFabLift } from '@/pages/Explore/hooks/useMapFabLift';
import { getLayoutHeight } from '@/utils/appViewport';
import SeoHead, { buildExploreJsonLd } from '@/components/SeoHead';
import './Explore.css';

const EXPLORE_TITLE = '어푸! | 전국 일일입장·자유수영 수영장 찾기';

const SEARCH_OPEN_PILL_GAP = 10;

function computeOpenPillStyle(sheetTop: number): CSSProperties {
  return {
    bottom: Math.max(16, getLayoutHeight() - sheetTop + SEARCH_OPEN_PILL_GAP),
  };
}

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
    show50mOnly,
    close50m,
    toggle50m,
  } = usePoolFilter();
  const { favorites } = useFavorites();
  const [searchPanelCollapsed, setSearchPanelCollapsed] = useState(false);
  const [searchSheetTop, setSearchSheetTop] = useState(
    Number.POSITIVE_INFINITY,
  );
  const [favoritesPanelCollapsed, setFavoritesPanelCollapsed] = useState(false);
  const [favoritesSheetTop, setFavoritesSheetTop] = useState(
    Number.POSITIVE_INFINITY,
  );
  const [nearbyPanelCollapsed, setNearbyPanelCollapsed] = useState(false);
  const [nearbySheetTop, setNearbySheetTop] = useState(
    Number.POSITIVE_INFINITY,
  );
  const [pools50mPanelCollapsed, setPools50mPanelCollapsed] = useState(false);
  const [pools50mSheetTop, setPools50mSheetTop] = useState(
    Number.POSITIVE_INFINITY,
  );
  const reopenSearchListRef = useRef<(() => void) | null>(null);
  const reopenFavoritesListRef = useRef<(() => void) | null>(null);
  const reopenNearbyListRef = useRef<(() => void) | null>(null);
  const reopenPools50mListRef = useRef<(() => void) | null>(null);
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
    show50mOnly,
    close50m,
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
    show50mPanel,
    show50mSheet,
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
    onPools50mSheetTopChange,
    onDetailSheetTopChange,
    onSearchSheetDragChange,
    onFavoritesSheetDragChange,
    onNearbySheetDragChange,
    onPools50mSheetDragChange,
    onDetailSheetDragChange,
  } = useMapFabLift({
    enabled: showMapFabs,
    detailOpen: Boolean(selectedPool) && !detailClosing,
    searchPanelOpen: showSearchPanel,
    searchPanelHidden: searchPanelBehindDetail,
    favoritesPanelOpen: showFavoritesSheet,
    nearbyPanelOpen: showNearbySheet,
    pools50mPanelOpen: show50mSheet,
  });

  const handleSearchSheetTopChange = useCallback(
    (top: number) => {
      setSearchSheetTop(top);
      onSearchSheetTopChange(top);
    },
    [onSearchSheetTopChange],
  );

  const handleFavoritesSheetTopChange = useCallback(
    (top: number) => {
      setFavoritesSheetTop(top);
      onFavoritesSheetTopChange(top);
    },
    [onFavoritesSheetTopChange],
  );

  const handleNearbySheetTopChange = useCallback(
    (top: number) => {
      setNearbySheetTop(top);
      onNearbySheetTopChange(top);
    },
    [onNearbySheetTopChange],
  );

  const handlePools50mSheetTopChange = useCallback(
    (top: number) => {
      setPools50mSheetTop(top);
      onPools50mSheetTopChange(top);
    },
    [onPools50mSheetTopChange],
  );

  const showSearchOpenPill =
    isSearching &&
    searchPanelCollapsed &&
    !loading &&
    !error &&
    !selectedPool &&
    !favoritesOpen &&
    !nearbyOpen &&
    !show50mOnly;

  const searchOpenPillStyle = useMemo((): CSSProperties | undefined => {
    if (!showSearchOpenPill || !Number.isFinite(searchSheetTop))
      return undefined;
    return computeOpenPillStyle(searchSheetTop);
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
    return computeOpenPillStyle(favoritesSheetTop);
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
    return computeOpenPillStyle(nearbySheetTop);
  }, [showNearbyOpenPill, nearbySheetTop]);

  const handleReopenNearbyList = useCallback(() => {
    reopenNearbyListRef.current?.();
  }, []);

  const show50mOpenPill =
    show50mOnly &&
    pools50mPanelCollapsed &&
    show50mSheet &&
    !isSearching &&
    !selectedPool;

  const pools50mOpenPillStyle = useMemo((): CSSProperties | undefined => {
    if (!show50mOpenPill || !Number.isFinite(pools50mSheetTop)) {
      return undefined;
    }
    return computeOpenPillStyle(pools50mSheetTop);
  }, [show50mOpenPill, pools50mSheetTop]);

  const handleReopenPools50mList = useCallback(() => {
    reopenPools50mListRef.current?.();
  }, []);

  const showNearbyEntryPill =
    !searchActive &&
    !isSearching &&
    !loading &&
    !error &&
    !favoritesOpen &&
    !nearbyOpen &&
    !show50mOnly &&
    !selectedPool;

  const show50mEntryPill =
    !searchActive &&
    !isSearching &&
    !loading &&
    !error &&
    !favoritesOpen &&
    !nearbyOpen &&
    !show50mOnly &&
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

  useEffect(() => {
    if (!show50mSheet) setPools50mPanelCollapsed(false);
  }, [show50mSheet]);

  const { mapPools, favoritePools, pools50m, mapMarkerPools } = useMapPools({
    pools,
    appliedSearchTerm,
    isSearching,
    isNearbyMode,
    userLocation,
    locationStatus,
    favorites,
    favoritesOpen,
    nearbyOpen,
    show50mOnly,
    selectedPool,
    onResetSelected: () => setSelectedPool(null),
  });

  return (
    <div
      className={`explore explore--map app-route ${showSearchPanel ? 'explore--searching' : ''} ${searchActive ? 'explore--suggesting' : ''} ${showFavoritesPanel ? 'explore--favorites' : ''} ${showNearbyPanel ? 'explore--nearby' : ''} ${show50mPanel ? 'explore--50m' : ''}`}
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
        <PoolListSheet
          {...searchResultPreset(appliedSearchTerm)}
          pools={mapPools}
          resetKey={appliedSearchTerm}
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
        <PoolListSheet
          {...POOL_LIST_PRESETS.favorites}
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
        <PoolListSheet
          {...POOL_LIST_PRESETS.nearby}
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

      {show50mSheet && (
        <PoolListSheet
          {...POOL_LIST_PRESETS.pools50m}
          pools={pools50m}
          resetKey={`50m-${show50mOnly}-${pools50m.length}`}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          onCollapsedChange={setPools50mPanelCollapsed}
          reopenListRef={reopenPools50mListRef}
          onTopChange={handlePools50mSheetTopChange}
          onDragChange={onPools50mSheetDragChange}
        />
      )}

      {show50mOpenPill && (
        <FloatingPill
          className="explore-search-open-pill"
          style={pools50mOpenPillStyle}
          onClick={handleReopenPools50mList}
          aria-label="목록 열기"
        />
      )}

      <div className="explore-map-overlay">
        <SearchBar
          value={
            favoritesOpen
              ? '즐겨찾기'
              : nearbyOpen
                ? '주변 수영장'
                : show50mOnly
                  ? '레인'
                  : inputValue
          }
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
        {(showNearbyEntryPill || show50mEntryPill) && (
          <div className="explore-nearby-entry">
            {showNearbyEntryPill && (
              <FloatingPill
                className="explore-nearby-entry-pill"
                onClick={toggleNearby}
                aria-label="주변수영장"
                icon={
                  <span
                    className="explore-nearby-entry-pill__icon material-symbols-outlined"
                    aria-hidden
                  >
                    pool
                  </span>
                }
              >
                주변수영장
              </FloatingPill>
            )}
            {show50mEntryPill && (
              <FloatingPill
                className="explore-50m-entry-pill"
                onClick={toggle50m}
                aria-label="50m레인"
                icon={<Tag variant="highlight">50m</Tag>}
              >
                레인
              </FloatingPill>
            )}
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
