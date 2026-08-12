import type { CSSProperties } from 'react';
import { Fragment, useMemo } from 'react';
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
import { useFabLift } from '@/pages/Explore/hooks/useFabLift';
import { usePanelSheet } from '@/pages/Explore/hooks/usePanelSheet';
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

type PanelSheet = ReturnType<typeof usePanelSheet>;

/** 패널이 접힌 채 열려 있을 때 뜨는 "목록 열기" 핀 하나의 표시 여부·위치. */
const useOpenPill = (active: boolean, sheet: PanelSheet) => {
  const show = active && sheet.collapsed;
  const style = useMemo((): CSSProperties | undefined => {
    if (!show || !Number.isFinite(sheet.sheetTop)) return undefined;
    return computeOpenPillStyle(sheet.sheetTop);
  }, [show, sheet.sheetTop]);
  return { show, style };
};

const Explore = () => {
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
    showNearbyPanel,
    show50mPanel,
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
  } = useFabLift({
    enabled: showMapFabs,
    detailOpen: Boolean(selectedPool) && !detailClosing,
    searchPanelOpen: showSearchPanel,
    searchPanelHidden: searchPanelBehindDetail,
    favoritesPanelOpen: showFavoritesPanel,
    nearbyPanelOpen: showNearbyPanel,
    pools50mPanelOpen: show50mPanel,
  });

  const searchSheet = usePanelSheet({
    show: showSearchPanel,
    onTopChange: onSearchSheetTopChange,
  });
  const favoritesSheet = usePanelSheet({
    show: showFavoritesPanel,
    onTopChange: onFavoritesSheetTopChange,
  });
  const nearbySheet = usePanelSheet({
    show: showNearbyPanel,
    onTopChange: onNearbySheetTopChange,
  });
  const pools50mSheet = usePanelSheet({
    show: show50mPanel,
    onTopChange: onPools50mSheetTopChange,
  });

  // showFavoritesPanel/showNearbyPanel/show50mPanel은 이미 !isSearching && !selectedPool을
  // 포함하므로(useExploreInteractions의 canShowBaselinePanel) 여기서 다시 체크하지 않는다.
  const searchOpenPill = useOpenPill(
    isSearching &&
      !loading &&
      !error &&
      !selectedPool &&
      !favoritesOpen &&
      !nearbyOpen &&
      !show50mOnly,
    searchSheet,
  );
  const favoritesOpenPill = useOpenPill(showFavoritesPanel, favoritesSheet);
  const nearbyOpenPill = useOpenPill(showNearbyPanel, nearbySheet);
  const pools50mOpenPill = useOpenPill(show50mPanel, pools50mSheet);

  const canShowEntryPills =
    !searchActive &&
    !isSearching &&
    !loading &&
    !error &&
    !favoritesOpen &&
    !nearbyOpen &&
    !show50mOnly &&
    !selectedPool;

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

  const baselinePanels = [
    {
      key: 'favorites',
      show: showFavoritesPanel,
      preset: POOL_LIST_PRESETS.favorites,
      pools: favoritePools,
      resetKey: `favorites-${favoritesOpen}-${favorites.length}`,
      sheet: favoritesSheet,
      onDragChange: onFavoritesSheetDragChange,
      openPill: favoritesOpenPill,
    },
    {
      key: 'nearby',
      show: showNearbyPanel,
      preset: POOL_LIST_PRESETS.nearby,
      pools: mapPools,
      resetKey: `nearby-${nearbyOpen}-${mapPools.length}`,
      sheet: nearbySheet,
      onDragChange: onNearbySheetDragChange,
      openPill: nearbyOpenPill,
    },
    {
      key: 'pools50m',
      show: show50mPanel,
      preset: POOL_LIST_PRESETS.pools50m,
      pools: pools50m,
      resetKey: `50m-${show50mOnly}-${pools50m.length}`,
      sheet: pools50mSheet,
      onDragChange: onPools50mSheetDragChange,
      openPill: pools50mOpenPill,
    },
  ];

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
          onCollapsedChange={searchSheet.onCollapsedChange}
          reopenListRef={searchSheet.reopenListRef}
          onTopChange={searchSheet.handleTopChange}
          onDragChange={onSearchSheetDragChange}
        />
      )}

      {searchOpenPill.show && (
        <FloatingPill
          className="explore-search-open-pill"
          style={searchOpenPill.style}
          onClick={searchSheet.handleReopen}
          aria-label="목록 열기"
        />
      )}

      {baselinePanels.map((panel) => (
        <Fragment key={panel.key}>
          {panel.show && (
            <PoolListSheet
              {...panel.preset}
              pools={panel.pools}
              resetKey={panel.resetKey}
              selectedPool={selectedPool}
              onSelectPool={handleSelectPool}
              onCollapsedChange={panel.sheet.onCollapsedChange}
              reopenListRef={panel.sheet.reopenListRef}
              onTopChange={panel.sheet.handleTopChange}
              onDragChange={panel.onDragChange}
            />
          )}

          {panel.openPill.show && (
            <FloatingPill
              className="explore-search-open-pill"
              style={panel.openPill.style}
              onClick={panel.sheet.handleReopen}
              aria-label="목록 열기"
            />
          )}
        </Fragment>
      ))}

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
        {canShowEntryPills && (
          <div className="explore-nearby-entry">
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
            <FloatingPill
              className="explore-50m-entry-pill"
              onClick={toggle50m}
              aria-label="50m레인"
              icon={<Tag variant="highlight">50m</Tag>}
            >
              레인
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
};

export default Explore;
