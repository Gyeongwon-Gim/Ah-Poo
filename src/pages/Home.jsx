import { useLocation, useNavigate } from 'react-router-dom';
import { LocateFixed, Star } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PoolMap from '../components/map/PoolMap';
import PoolDetailSheet from '../components/map/PoolDetailSheet';
import SearchResultsPanel from '../components/map/SearchResultsPanel';
import SearchSuggestions from '../components/map/SearchSuggestions';
import HomeStatusOverlay from '../components/map/HomeStatusOverlay';
import { getPoolListKey } from '../utils/poolKey';
import { useMainTab } from '../contexts/MainTabContext';
import { useFavorites } from '../hooks/useFavorites';
import { useUserLocation } from '../hooks/useUserLocation';
import { usePoolData } from '../hooks/usePoolData';
import { useMapPools } from '../hooks/useMapPools';
import { useHomeInteractions } from '../hooks/useHomeInteractions';
import { useMapFabLift } from '../hooks/useMapFabLift';
import './Home.css';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    favoritesOpen,
    closeFavorites,
    toggleFavorites,
    setFloatingNavHidden,
  } = useMainTab();
  const { favorites } = useFavorites();
  const {
    location: userLocation,
    status: locationStatus,
    refreshLocation,
  } = useUserLocation();

  const { pools, loading, error, reload } = usePoolData();

  const interactions = useHomeInteractions({
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
    favoritesExpanded,
    setFavoritesExpanded,
    handleFavoritesDismissStart,
    handleFavoritesDismiss,
    favoritesDismissing,
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
    onDetailSheetTopChange,
    onSearchSheetDragChange,
    onFavoritesSheetDragChange,
    onDetailSheetDragChange,
  } = useMapFabLift({
    enabled: showMapFabs,
    detailOpen: Boolean(selectedPool) && !detailClosing,
    searchPanelOpen: showSearchPanel,
    searchPanelHidden: searchPanelBehindDetail,
    favoritesPanelOpen: showFavoritesSheet && !favoritesDismissing,
  });

  const { mapPools, favoritePools, mapMarkerPools } = useMapPools({
    pools,
    appliedSearchTerm,
    isSearching,
    isNearbyMode,
    userLocation,
    locationStatus,
    favorites,
    favoritesOpen,
    selectedPool,
    onResetSelected: () => setSelectedPool(null),
  });

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
        userLocationMarker={
          canRecenter && (isNearbyMode || showUserLocationMarker)
            ? userLocation
            : null
        }
        fitToUser={isNearbyMode}
      />

      {!searchActive && !loading && !error && (
        <div
          className={`home-map-actions${fabInteractive ? '' : ' home-map-actions--inert'}${sheetDragging ? ' home-map-actions--dragging' : ''}`}
          style={{
            ...fabStyle,
            '--map-fab-default-bottom': defaultFabBottom,
          }}
          aria-hidden={!fabInteractive}
        >
          <button
            type="button"
            className={`home-map-fab${favoritesOpen ? ' home-map-fab--active' : ''}`}
            onClick={toggleFavorites}
            aria-label="즐겨찾기"
            aria-pressed={favoritesOpen}
          >
            <Star
              size={17}
              strokeWidth={1.5}
              color="#ffcc00"
              fill="#ffcc00"
              aria-hidden
            />
          </button>
          <button
            type="button"
            className="home-map-fab"
            onClick={handleRecenter}
            aria-label="현재 위치로 이동"
          >
            <LocateFixed size={18} strokeWidth={1.5} />
          </button>
        </div>
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
          onTopChange={onSearchSheetTopChange}
          onDragChange={onSearchSheetDragChange}
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
          onTopChange={onFavoritesSheetTopChange}
          onDragChange={onFavoritesSheetDragChange}
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

      <HomeStatusOverlay
        loading={loading}
        error={error}
        onRetry={reload}
        onLocationRetry={refreshLocation}
        showLocationPending={showLocationPending}
        isSearching={isSearching}
        locationStatus={locationStatus}
        isNearbyMode={isNearbyMode}
        mapPoolCount={mapPools.length}
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

export default Home;
