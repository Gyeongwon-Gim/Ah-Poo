import { RefreshCw } from 'lucide-react';
import { Button } from '@/components';
import { isSupabaseConfigured } from '@/lib/supabase';
import { NEARBY_RADIUS_KM } from '@/utils/geo';
import './MapStatusMessage.css';

interface MapStatusMessageProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLocationRetry?: () => void;
  showLocationPending?: boolean;
  isSearching?: boolean;
  locationStatus?: string;
  isNearbyMode?: boolean;
  mapPoolCount?: number;
  poolCount?: number;
}

/** 지도 위 로딩·에러·빈 상태 안내 */
export default function MapStatusMessage({
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
}: MapStatusMessageProps) {
  return (
    <>
      {loading && (
        <div className="map-status-message" aria-live="polite">
          수영장 정보를 불러오는 중…
        </div>
      )}

      {showLocationPending && (
        <div className="map-status-message" aria-live="polite">
          내 위치를 확인하는 중…
        </div>
      )}

      {error && !loading && (
        <div className="map-status-message map-status-message--error" role="alert">
          <p>{error}</p>
          {!isSupabaseConfigured && (
            <p className="map-status-message__hint">
              <code>.env</code>에 Supabase 설정을 확인하세요.
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            className="map-status-message__retry"
            onClick={onRetry}
          >
            <RefreshCw size={16} />
            다시 시도
          </Button>
        </div>
      )}

      {!loading &&
        !error &&
        !isSearching &&
        (locationStatus === 'denied' || locationStatus === 'unsupported') && (
          <div className="map-status-message">
            <p>위치 권한이 필요합니다</p>
            <p className="map-status-message__hint">
              Safari 설정 → 웹사이트 → 위치에서 이 사이트를 허용해 주세요
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        !isSearching &&
        locationStatus === 'unavailable' && (
          <div className="map-status-message">
            <p>위치를 확인할 수 없습니다</p>
            <p className="map-status-message__hint">
              아래 현재 위치 버튼을 눌러 다시 시도해 보세요
            </p>
            {onLocationRetry && (
              <Button
                variant="primary"
                size="sm"
                className="map-status-message__retry"
                onClick={onLocationRetry}
              >
                <RefreshCw size={16} />
                위치 다시 확인
              </Button>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        !showLocationPending &&
        isNearbyMode &&
        mapPoolCount === 0 &&
        poolCount !== undefined &&
        poolCount > 0 && (
          <div className="map-status-message">
            <p>{NEARBY_RADIUS_KM}km 이내에 등록된 수영장이 없습니다</p>
            <p className="map-status-message__hint">
              검색하면 다른 지역 수영장도 찾을 수 있어요
            </p>
          </div>
        )}

      {!loading && !error && poolCount === 0 && (
        <div className="map-status-message">
          <p>등록된 수영장이 없습니다</p>
        </div>
      )}
    </>
  );
}
