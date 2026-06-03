import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPoolByKey, isFlagOn } from '../services/pools';
import { parsePoolKeyFromSearchParams } from '../utils/poolKey';
import { formatPoolFee } from '../utils/formatFee';
import PoolScheduleTags from '../components/PoolScheduleTags';
import PageSheet from '../components/PageSheet';
import './PoolDetail.css';

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

  const handleDirections = () => {
    const url = `https://map.kakao.com/link/map/${pool.name},${pool.lat},${pool.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pool-detail pool-detail--sheet">
      <div className="pool-detail-header">
        <button type="button" className="back-button" onClick={onClose}>
          ←
        </button>
      </div>

      <div className="pool-detail-image">
        <div className="pool-detail-image-placeholder">
          ⚠️🦭Work In Progress⚠️
        </div>
      </div>

      <div className="pool-detail-content">
        <div className="pool-detail-section">
          <h1>{pool.name}</h1>
          <p>위치 {pool.address}</p>
          <button
            type="button"
            className="directions-button"
            onClick={handleDirections}
          >
            길찾기
          </button>
          {(pool.url || pool.url2) && (
            <div className="pool-detail-links">
              {pool.url && (
                <a
                  href={pool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pool-detail-link"
                >
                  공식 사이트
                </a>
              )}
              {pool.url2 && (
                <a
                  href={pool.url2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pool-detail-link pool-detail-link--secondary"
                >
                  추가 링크
                </a>
              )}
            </div>
          )}
        </div>

        <div className="pool-detail-section">
          <h2>일일입장료</h2>
          <p>{pool.fee ? formatPoolFee(pool.fee) : '정보 없음'}</p>
        </div>

        <div className="pool-detail-section">
          <h2>운영정보</h2>
          <PoolScheduleTags pool={pool} />
          {!isFlagOn(pool.is50m) &&
            !isFlagOn(pool.isWeekday) &&
            !isFlagOn(pool.isSaturday) &&
            !isFlagOn(pool.isSunday) &&
            !isFlagOn(pool.isHoliday) && (
              <p className="pool-detail-empty">등록된 운영 정보가 없습니다.</p>
            )}
        </div>
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
