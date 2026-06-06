import { memo } from 'react'
import { Star } from 'lucide-react'
import PoolThumbnails from '../PoolThumbnails'
import { useFavorites } from '../../hooks/useFavorites'
import { isFlagOn } from '../../services/pools'
import { formatDailyAdmissionFee } from '../../utils/formatFee'
import './SearchResultsPanel.css'

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function SearchResultItem({ pool, selected, onSelect }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(pool)
  const distanceLabel = formatDistance(pool.distanceKm)
  const feeLabel = pool.fee ? formatDailyAdmissionFee(pool.fee) : null

  const hasTags = isFlagOn(pool.is50m) || isFlagOn(pool.isWeekday)

  return (
    <article
      className={`search-result-item ${selected ? 'search-result-item--selected' : ''}`}
      onClick={() => onSelect(pool)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(pool)
      }}
      aria-pressed={selected}
    >
      <div className="search-result-item__body">
        <div className="search-result-item__content">
          <h3 className="search-result-item__name">{pool.name}</h3>

          <p className="search-result-item__subline">
            <span className="search-result-item__category">수영장</span>
            {feeLabel && (
              <>
                <span className="search-result-item__dot" aria-hidden>
                  ·
                </span>
                <span>{feeLabel}</span>
              </>
            )}
            {distanceLabel && (
              <>
                <span className="search-result-item__dot" aria-hidden>
                  ·
                </span>
                <span>{distanceLabel}</span>
              </>
            )}
          </p>

          <p className="search-result-item__address">{pool.address}</p>

          {hasTags && (
            <div className="search-result-item__tags">
              {isFlagOn(pool.is50m) && (
                <span className="search-result-item__tag">50m</span>
              )}
              {isFlagOn(pool.isWeekday) && (
                <span className="search-result-item__tag">평일</span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`search-result-item__favorite ${
            favorite ? 'search-result-item__favorite--active' : ''
          }`}
          aria-label="즐겨찾기"
          aria-pressed={favorite}
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(pool)
          }}
        >
          <Star
            size={18}
            strokeWidth={1.5}
            fill={favorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <PoolThumbnails />
    </article>
  )
}

// memo: 시트 드래그로 부모가 매 프레임 리렌더돼도
// pool/selected/onSelect가 그대로면 다시 그리지 않는다.
export default memo(SearchResultItem)
