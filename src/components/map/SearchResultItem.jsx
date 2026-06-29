import { memo, useEffect, useState } from 'react'
import { Star, Waves } from 'lucide-react'
import { useFavorites } from '../../hooks/useFavorites'
import { isFlagOn } from '../../services/pools'
import { fetchPoolImageUrl } from '../../services/poolImages'
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
  const [poolImageUrl, setPoolImageUrl] = useState(null)
  const [poolImageFailed, setPoolImageFailed] = useState(false)

  useEffect(() => {
    if (!pool?.id) return undefined

    const controller = new AbortController()
    setPoolImageUrl(null)
    setPoolImageFailed(false)

    fetchPoolImageUrl(pool.id, { signal: controller.signal })
      .then((url) => {
        if (!controller.signal.aborted) {
          setPoolImageUrl(url)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setPoolImageUrl(null)
      })

    return () => controller.abort()
  }, [pool?.id])

  const show50mTag = isFlagOn(pool.is50m)

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
        {poolImageUrl && !poolImageFailed ? (
          <div className="search-result-item__media">
            <img
              className="search-result-item__media-img"
              src={poolImageUrl}
              alt=""
              loading="lazy"
              onError={() => setPoolImageFailed(true)}
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
              <span className="search-result-item__tag search-result-item__tag--50m">50m</span>
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
    </article>
  )
}

// memo: 시트 드래그로 부모가 매 프레임 리렌더돼도
// pool/selected/onSelect가 그대로면 다시 그리지 않는다.
export default memo(SearchResultItem)
