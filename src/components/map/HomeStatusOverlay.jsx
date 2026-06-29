import { RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { NEARBY_RADIUS_KM } from '../../utils/geo';

/** 홈 지도 위에 겹쳐 보이는 로딩·에러·빈 상태 안내 모음 */
function HomeStatusOverlay({
  loading,
  error,
  onRetry,
  onLocationRetry,
  showLocationPending,
  isSearching,
  locationStatus,
  isNearbyMode,
  mapPoolCount,
  poolCount,
}) {
  return (
    <>
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
          <button type="button" className="home-retry" onClick={onRetry}>
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
              Safari 설정 → 웹사이트 → 위치에서 이 사이트를 허용해 주세요
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        !isSearching &&
        locationStatus === 'unavailable' && (
          <div className="home-map-status">
            <p>위치를 확인할 수 없습니다</p>
            <p className="home-map-status__hint">
              아래 현재 위치 버튼을 눌러 다시 시도해 보세요
            </p>
            {onLocationRetry && (
              <button
                type="button"
                className="home-retry"
                onClick={onLocationRetry}
              >
                <RefreshCw size={16} />
                위치 다시 확인
              </button>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        !showLocationPending &&
        isNearbyMode &&
        mapPoolCount === 0 &&
        poolCount > 0 && (
          <div className="home-map-status">
            <p>{NEARBY_RADIUS_KM}km 이내에 등록된 수영장이 없습니다</p>
            <p className="home-map-status__hint">
              검색하면 다른 지역 수영장도 찾을 수 있어요
            </p>
          </div>
        )}

      {!loading && !error && poolCount === 0 && (
        <div className="home-map-status">
          <p>등록된 수영장이 없습니다</p>
        </div>
      )}
    </>
  );
}

export default HomeStatusOverlay;
