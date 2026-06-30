import { memo } from 'react';
import { Star, Waves } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { usePoolImageUrl } from '../../hooks/usePoolImageUrl';
import { isFlagOn } from '../../services/pools';
import { formatDailyAdmissionFee } from '../../utils/formatFee';
import { formatDistance } from '../../utils/formatDistance';
import type { Pool } from '../../types/pool';
import './SearchResultItem.css';

interface SearchResultItemProps {
  pool: Pool;
  selected: boolean;
  onSelect: (pool: Pool) => void;
}

function SearchResultItem({ pool, selected, onSelect }: SearchResultItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const distanceLabel = formatDistance(pool.distanceKm);
  const feeLabel = pool.fee ? formatDailyAdmissionFee(pool.fee) : null;
  const { poolImageUrl, poolImageFailed, markPoolImageFailed } =
    usePoolImageUrl(pool.id);

  const show50mTag = isFlagOn(pool.is50m);

  return (
    <article
      className={`search-result-item ${selected ? 'search-result-item--selected' : ''}`}
      onClick={() => onSelect(pool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(pool);
      }}
      aria-pressed={selected}
    >
      <div className="search-result-item__body">
        {poolImageUrl && !poolImageFailed ? (
          <div className="search-result-item__media">
            <img
              className="search-result-item__media-img"
              src={poolImageUrl}
              alt=""
              loading="lazy"
              onError={markPoolImageFailed}
            />
          </div>
        ) : (
          <div
            className="search-result-item__media search-result-item__media--placeholder"
            aria-hidden
          >
            <Waves size={20} />
          </div>
        )}

        <div className="search-result-item__content">
          <div className="search-result-item__title-row">
            <h3 className="search-result-item__name">{pool.name}</h3>
            {show50mTag && (
              <span className="search-result-item__tag search-result-item__tag--50m">
                50m
              </span>
            )}
          </div>

          {(feeLabel || distanceLabel) && (
            <p className="search-result-item__subline">
              {feeLabel && <span>{feeLabel}</span>}
              {feeLabel && distanceLabel && (
                <span className="search-result-item__dot" aria-hidden>
                  ·
                </span>
              )}
              {distanceLabel && <span>{distanceLabel}</span>}
            </p>
          )}

          <p className="search-result-item__address">{pool.roadAddress}</p>
        </div>

        <button
          type="button"
          className={`search-result-item__favorite ${
            favorite ? 'search-result-item__favorite--active' : ''
          }`}
          aria-label="즐겨찾기"
          aria-pressed={favorite}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(pool);
          }}
        >
          <Star
            size={18}
            strokeWidth={1.5}
            fill={favorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    </article>
  );
}

export default memo(SearchResultItem);
