import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  Navigation,
  Globe,
  Link as LinkIcon,
} from 'lucide-react';
import { fetchPoolByKey, isFlagOn } from '../services/pools';
import { parsePoolKeyFromSearchParams } from '../utils/poolKey';
import { formatDailyAdmissionFee } from '../utils/formatFee';
// import PoolThumbnails from '../components/PoolThumbnails'; // TODO: 이미지 데이터 확보 후 복구
import PoolScheduleTags from '../components/PoolScheduleTags';
import PageSheet from '../components/PageSheet';
import './PoolDetail.css';

const ICON_COLOR = '#4b5563';

function PoolDetailContent({ onClose, pool, poolKey, loading, error }) {
  if (loading) {
    return (
      <div className="pool-detail pool-detail--sheet">
        <div className="pool-detail-status">수영장 정보를 불러오는 중…</div>
      </div>
    );
  }

  if (!poolKey) {
    return (
      <div className="pool-detail pool-detail--sheet">
        <div className="not-found">
          <h2>잘못된 수영장 링크입니다</h2>
          <button type="button" onClick={onClose}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pool-detail pool-detail--sheet">
        <div
          className="pool-detail-status pool-detail-status--error"
          role="alert"
        >
          <p>{error}</p>
          <button type="button" onClick={onClose}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="pool-detail pool-detail--sheet">
        <div className="not-found">
          <h2>수영장을 찾을 수 없습니다</h2>
          <button type="button" onClick={onClose}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const hasSchedule =
    isFlagOn(pool.is50m) ||
    isFlagOn(pool.isWeekday) ||
    isFlagOn(pool.isSaturday) ||
    isFlagOn(pool.isSunday) ||
    isFlagOn(pool.isHoliday);

  const handleDirections = () => {
    const url = `https://map.kakao.com/link/map/${pool.name},${pool.lat},${pool.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pool-detail pool-detail--sheet">
      <div className="pool-detail__head">
        <header className="pool-detail__toolbar">
          <button
            type="button"
            className="pool-detail__back"
            onClick={onClose}
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={30} strokeWidth={1.5} aria-hidden />
          </button>
        </header>
        <h1 className="pool-detail__name">{pool.name}</h1>
      </div>

      <div className="pool-detail__intro">
        <p className="pool-detail__subline">
          <span className="pool-detail__category">수영장</span>
          {pool.fee && (
            <>
              <span className="pool-detail__dot" aria-hidden>
                ·
              </span>
              <span>{formatDailyAdmissionFee(pool.fee)}</span>
            </>
          )}
        </p>

        <p className="pool-detail__address">
          <MapPin size={14} aria-hidden />
          <span>{pool.address}</span>
        </p>

        <div className="pool-detail__actions">
          <button
            type="button"
            className="pool-detail__action"
            onClick={handleDirections}
          >
            <Navigation size={18} color={ICON_COLOR} />
            <span>길찾기</span>
          </button>
          {pool.official_url && (
            <a
              className="pool-detail__action"
              href={pool.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={18} color={ICON_COLOR} />
              <span>사이트</span>
            </a>
          )}
          {pool.url2 && (
            <a
              className="pool-detail__action"
              href={pool.url2}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIcon size={18} color={ICON_COLOR} />
              <span>링크</span>
            </a>
          )}
        </div>

        {/* TODO: 이미지 데이터 확보 후 복구
        <PoolThumbnails className="pool-thumbs--detail" />
        */}
      </div>

      <div className="pool-detail__detail">
        <section className="pool-detail__section">
          <p>
            {pool.fee
              ? formatDailyAdmissionFee(pool.fee)
              : '일일입장 정보 없음'}
          </p>
        </section>

        <section className="pool-detail__section">
          <h2 className="pool-detail__section-title">운영정보</h2>
          <PoolScheduleTags pool={pool} />
          {!hasSchedule && (
            <p className="pool-detail__empty">등록된 운영 정보가 없습니다.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function PoolDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const poolKey = parsePoolKeyFromSearchParams(searchParams);

  useEffect(() => {
    let cancelled = false;

    async function loadPool() {
      if (!poolKey) {
        setLoading(false);
        setPool(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPoolByKey(poolKey);
        if (!cancelled) setPool(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? '수영장 정보를 불러오지 못했습니다.');
          setPool(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPool();
    return () => {
      cancelled = true;
    };
  }, [searchParams.toString()]);

  return (
    <PageSheet onClose={() => navigate('/')}>
      {({ onClose }) => (
        <PoolDetailContent
          onClose={onClose}
          pool={pool}
          poolKey={poolKey}
          loading={loading}
          error={error}
        />
      )}
    </PageSheet>
  );
}

export default PoolDetail;
