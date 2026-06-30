import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Home, Navigation } from 'lucide-react';
import SeoHead, {
  buildPoolSportsActivityJsonLd,
  DEFAULT_OG_IMAGE,
} from '../components/SeoHead';
import PoolScheduleTags from '../components/PoolScheduleTags';
import { fetchPoolById } from '../services/pools';
import { formatDailyAdmissionFee } from '../utils/formatFee';
import { buildKakaoDirectionsUrl } from '../utils/kakaoDirectionsUrl';
import type { Pool } from '../types/pool';
import './PoolDetail.css';

function buildPoolTitle(pool: Pool): string {
  return `${pool.name} 일일입장·자유수영 | 어푸!`;
}

function buildPoolDescription(pool: Pool): string {
  const parts = [pool.roadAddress];
  if (pool.fee) {
    parts.push(formatDailyAdmissionFee(pool.fee));
  }
  parts.push('50m 레인·운영일 정보');
  return `${parts.filter(Boolean).join(' · ')} — 어푸!에서 전국 일일입장·자유수영 수영장 정보를 확인하세요.`;
}

function PoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('수영장 ID가 없습니다.');
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchPoolById(id)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPool(data);
        if (!data) {
          setError('수영장을 찾을 수 없습니다.');
        }
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setError(err.message ?? '수영장 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          document.dispatchEvent(new Event('render-event'));
        }
      });

    return () => controller.abort();
  }, [id]);

  const title = pool ? buildPoolTitle(pool) : '수영장 정보 | 어푸!';
  const description = pool
    ? buildPoolDescription(pool)
    : '전국 일일입장·자유수영 수영장 정보';
  const path = id ? `/pool/${id}` : '/pool';

  const handleOpenOnMap = () => {
    if (!pool) return;
    navigate('/', { state: { openPool: pool } });
  };

  if (loading) {
    return (
      <div className="pool-detail">
        <SeoHead title={title} description={description} path={path} noindex />
        <p className="pool-detail__status">수영장 정보를 불러오는 중…</p>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="pool-detail">
        <SeoHead
          title="수영장을 찾을 수 없습니다 | 어푸!"
          description={error ?? '수영장을 찾을 수 없습니다.'}
          path={path}
          noindex
        />
        <Link to="/" className="pool-detail__back">
          <ChevronLeft size={20} aria-hidden />
          어푸! 홈으로
        </Link>
        <p className="pool-detail__status pool-detail__status--error">
          {error ?? '수영장을 찾을 수 없습니다.'}
        </p>
      </div>
    );
  }

  const feeLabel = pool.fee ? formatDailyAdmissionFee(pool.fee) : null;

  return (
    <div className="pool-detail">
      <SeoHead
        title={title}
        description={description}
        path={path}
        image={DEFAULT_OG_IMAGE}
        type="article"
        jsonLd={buildPoolSportsActivityJsonLd(pool)}
      />

      <Link to="/" className="pool-detail__back">
        <ChevronLeft size={20} aria-hidden />
        어푸! 홈으로
      </Link>

      <article id="seo-crawler-content">
        <header className="pool-detail__header">
          <h1 className="pool-detail__name">{pool.name}</h1>
          {feeLabel && <p className="pool-detail__fee">{feeLabel}</p>}
        </header>

        {pool.roadAddress && (
          <section className="pool-detail__section">
            <span className="pool-detail__label">주소</span>
            <p className="pool-detail__value">{pool.roadAddress}</p>
          </section>
        )}

        {pool.phone && (
          <section className="pool-detail__section">
            <span className="pool-detail__label">전화</span>
            <p className="pool-detail__value">
              <a href={`tel:${pool.phone.replace(/\s/g, '')}`}>{pool.phone}</a>
            </p>
          </section>
        )}

        <section className="pool-detail__section">
          <span className="pool-detail__label">운영 정보</span>
          <PoolScheduleTags pool={pool} />
        </section>

        {pool.official_url && (
          <section className="pool-detail__section">
            <span className="pool-detail__label">홈페이지</span>
            <p className="pool-detail__value">
              <a href={pool.official_url} target="_blank" rel="noopener noreferrer">
                {pool.official_url}
              </a>
            </p>
          </section>
        )}

        <p className="pool-detail__value">
          {pool.name}은(는) {pool.roadAddress || '전국'}에 위치한 일일입장·자유수영
          수영장입니다.
          {feeLabel ? ` ${feeLabel}입니다.` : ''}
          {' '}
          어푸!에서 전국 수영장 일일입장·자유수영 정보를 지도로 검색해 보세요.
        </p>
      </article>

      <div className="pool-detail__actions">
        <button type="button" className="pool-detail__action" onClick={handleOpenOnMap}>
          <Home size={18} aria-hidden />
          지도에서 보기
        </button>
        <a
          className="pool-detail__action pool-detail__action--secondary"
          href={buildKakaoDirectionsUrl(pool)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation size={18} aria-hidden />
          길찾기
        </a>
      </div>
    </div>
  );
}

export default PoolDetail;
