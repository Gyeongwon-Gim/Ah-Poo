import { useMemo, useEffect } from 'react';
import { getPoolListKey } from '../utils/poolKey';
import { filterBySearchTerm } from '../utils/poolSearch';
import {
  filterPoolsWithinKm,
  enrichWithDistance,
  sortByDistanceAsc,
  NEARBY_RADIUS_KM,
} from '../utils/geo';

/**
 * 현재 모드(검색/주변/즐겨찾기)에 따라 지도에 표시할 수영장 목록을 계산한다.
 * 검색 중 선택된 수영장이 결과에서 사라지면 선택을 해제한다.
 */
export function useMapPools({
  pools,
  appliedSearchTerm,
  isSearching,
  isNearbyMode,
  userLocation,
  locationStatus,
  favorites,
  favoritesOpen,
  selectedPool,
  onResetSelected,
}) {
  const mapPools = useMemo(() => {
    let result;

    if (isSearching) {
      result = filterBySearchTerm(pools, appliedSearchTerm);
    } else if (locationStatus === 'pending') {
      return [];
    } else if (isNearbyMode) {
      return filterPoolsWithinKm(pools, userLocation, NEARBY_RADIUS_KM);
    } else if (locationStatus === 'denied' || locationStatus === 'unsupported') {
      return [];
    } else {
      result = filterBySearchTerm(pools, appliedSearchTerm);
    }

    if (userLocation && result.length > 0) {
      return sortByDistanceAsc(
        result.map((pool) => enrichWithDistance(pool, userLocation)),
      );
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

  const favoritePools = useMemo(() => {
    if (!userLocation || locationStatus !== 'ready') return favorites;

    return sortByDistanceAsc(
      favorites.map((pool) => enrichWithDistance(pool, userLocation)),
    );
  }, [favorites, userLocation, locationStatus]);

  const mapMarkerPools = useMemo(() => {
    let result = isSearching
      ? mapPools
      : favoritesOpen
        ? favoritePools
        : mapPools;

    if (
      selectedPool &&
      !result.some((p) => getPoolListKey(p) === getPoolListKey(selectedPool))
    ) {
      result = [...result, selectedPool];
    }

    return result;
  }, [isSearching, favoritesOpen, mapPools, favoritePools, selectedPool]);

  useEffect(() => {
    if (!selectedPool || !isSearching) return;
    const stillVisible = mapPools.some(
      (p) => getPoolListKey(p) === getPoolListKey(selectedPool),
    );
    if (!stillVisible) onResetSelected();
  }, [mapPools, selectedPool, isSearching, onResetSelected]);

  return { mapPools, favoritePools, mapMarkerPools };
}
