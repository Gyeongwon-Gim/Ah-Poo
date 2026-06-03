import { Star, Waves } from 'lucide-react'
import { isFlagOn } from '../../services/pools'
import { formatPoolFee } from '../../utils/formatFee'
import './SearchResultsPanel.css'

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

function SearchResultItem({ pool, selected, onSelect }) {
  const distanceLabel = formatDistance(pool.distanceKm)
  const feeLabel = pool.fee ? formatPoolFee(pool.fee) : null

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
      <div className="search-result-item__header">
        <div className="search-result-item__title-row">
          <h3 className="search-result-item__name">{pool.name}</h3>
          <span className="search-result-item__category">수영장</span>
        </div>
        <button
          type="button"
          className="search-result-item__favorite"
          aria-label="즐겨찾기"
          onClick={(e) => e.stopPropagation()}
        >
          <Star size={18} strokeWidth={2} />
        </button>
      </div>

      {feeLabel && (
        <p className="search-result-item__tagline">{feeLabel}</p>
      )}

      <p className="search-result-item__meta">
        {distanceLabel && (
          <>
            <span>{distanceLabel}</span>
            <span className="search-result-item__dot" aria-hidden>
              ·
            </span>
          </>
        )}
        <span className="search-result-item__meta-address">{pool.address}</span>
      </p>

      <div className="search-result-item__tags">
        {isFlagOn(pool.is50m) && (
          <span className="search-result-item__tag">50m</span>
        )}
        {isFlagOn(pool.isWeekday) && (
          <span className="search-result-item__tag">평일</span>
        )}
      </div>

      <div className="search-result-item__thumbs" aria-hidden>
        <div className="search-result-item__thumb">
          <Waves size={20} />
        </div>
        <div className="search-result-item__thumb search-result-item__thumb--alt">
          <span>🏊</span>
        </div>
        <div className="search-result-item__thumb search-result-item__thumb--alt2">
          <span>🦭</span>
        </div>
      </div>
    </article>
  )
}

export default SearchResultItem
