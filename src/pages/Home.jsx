import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LocateFixed, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import PoolMap from '../components/map/PoolMap';
import PoolMapPreview from '../components/map/PoolMapPreview';
import { fetchPools } from '../services/pools';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPoolListKey } from '../utils/poolKey';
import {
  filterPoolsWithinKm,
  getDistanceKm,
  NEARBY_RADIUS_KM,
} from '../utils/geo';
import SearchResultsPanel from '../components/map/SearchResultsPanel';
import { useUserLocation } from '../hooks/useUserLocation';
import './Home.css';

function filterBySearchTerm(pools, searchTerm) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return pools;

  return pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(term) ||
      pool.address.toLowerCase().includes(term) ||
      (pool.fee && pool.fee.toLowerCase().includes(term)),
  );
}

function Home() {
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
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
    if (!selectedPool) return;
    const stillVisible = mapPools.some(
      (p) => getPoolListKey(p) === getPoolListKey(selectedPool),
    );
    if (!stillVisible) setSelectedPool(null);
  }, [mapPools, selectedPool]);

  const handleSelectPool = useCallback((pool) => {
    setSelectedPool((prev) =>
      prev && getPoolListKey(prev) === getPoolListKey(pool) ? null : pool,
    );
  }, []);

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
  const showSearchList = isSearching && !loading && !error;

  return (
    <div
      className={`home home--map app-route ${showSearchList ? 'home--list-view' : ''}`}
    >
      {!showSearchList && (
        <PoolMap
          ref={mapRef}
          pools={mapPools}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          userLocation={canRecenter ? userLocation : null}
          fitToUser={isNearbyMode}
        />
      )}

      {!showSearchList && canRecenter && (
        <button
          type="button"
          className={`home-location-btn ${
            isSearching
              ? 'home-location-btn--with-search'
              : selectedPool
                ? 'home-location-btn--with-preview'
                : ''
          }`}
          onClick={handleRecenter}
          aria-label="현재 위치로 이동"
        >
          <LocateFixed size={22} strokeWidth={2.5} />
        </button>
      )}

      {showSearchList && (
        <SearchResultsPanel
          pools={mapPools}
          searchTerm={appliedSearchTerm}
          selectedPool={selectedPool}
          onSelectPool={handleSelectPool}
          listView={showSearchList}
        />
      )}

      <div className="home-map-overlay">
        <Header poolCount={mapPools.length} loading={loading} variant="map" />
        <SearchBar
          onSearch={setAppliedSearchTerm}
          appliedSearchTerm={appliedSearchTerm}
          resultCount={mapPools.length}
          totalCount={pools.length}
          searching={loading}
          variant="map"
          listView={showSearchList}
          nearbyMode={isNearbyMode}
          nearbyRadiusKm={NEARBY_RADIUS_KM}
          locationPending={showLocationPending}
        />
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

      {!isSearching && (
        <PoolMapPreview
          pool={selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}
    </div>
  );
}

export default Home;
