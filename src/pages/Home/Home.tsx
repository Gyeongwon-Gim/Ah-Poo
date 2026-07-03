import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocateFixed, Star } from 'lucide-react';
import SearchBar from '@/pages/Home/components/SearchBar';
import { Button } from '@/components';
import PoolMap from '@/pages/Home/components/PoolMap';
import PoolDetailSheet from '@/pages/Home/components/PoolDetailSheet';
import SearchResult from '@/pages/Home/components/SearchResult';
import Favorites from '@/pages/Home/components/Favorites';
import SearchSuggestions from '@/pages/Home/components/SearchSuggestions';
import MapStatusMessage from '@/pages/Home/components/MapStatusMessage';
import { getPoolListKey } from '@/utils/poolKey';
import { useMainTab } from '@/contexts/MainTabContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserLocation } from '@/hooks/useUserLocation';
import { usePoolData } from '@/hooks/usePoolData';
import { useMapPools } from '@/hooks/useMapPools';
import { useHomeInteractions } from '@/hooks/useHomeInteractions';
import { useMapFabLift } from '@/hooks/useMapFabLift';
import SeoHead, { buildHomeJsonLd } from '@/components/SeoHead';
import './Home.css';

const HOME_TITLE = '어푸! | 전국 일일입장·자유수영 수영장 찾기';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { favoritesOpen, closeFavorites, toggleFavorites } = useMainTab();
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
    favoritesPanelOpen: showFavoritesSheet,
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
      <SeoHead title={HOME_TITLE} path="/" jsonLd={buildHomeJsonLd()} />
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
        fitMode={isSearching ? 'search' : 'default'}
        searchTerm={appliedSearchTerm}
      />

      {!searchActive && !loading && !error && (
        <div
          className={`home-map-actions${fabInteractive ? '' : ' home-map-actions--inert'}${sheetDragging ? ' home-map-actions--dragging' : ''}`}
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
          onDismiss={handleCloseSearch}
          onTopChange={onSearchSheetTopChange}
          onDragChange={onSearchSheetDragChange}
        />
      )}

      {showFavoritesSheet && (
        <Favorites
          pools={favoritePools}
          resetKey={`favorites-${favoritesOpen}-${favorites.length}`}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          onDismiss={closeFavorites}
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

      <MapStatusMessage
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
          userLocation={userLocation}
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
