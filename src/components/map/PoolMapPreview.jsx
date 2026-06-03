import { useNavigate } from 'react-router-dom'
import { MapPin, Coins, X, ChevronRight } from 'lucide-react'
import { poolToSearchParams } from '../../utils/poolKey'
import { formatPoolFee } from '../../utils/formatFee'
import './PoolMapPreview.css'

function PoolMapPreview({ pool, onClose }) {
  const navigate = useNavigate()

  if (!pool) return null

  const handleOpenDetail = () => {
    navigate(`/pool?${poolToSearchParams(pool)}`, { state: { from: 'map' } })
  }

  return (
    <div className="pool-map-preview" role="dialog" aria-label="수영장 미리보기">
      <button
        type="button"
        className="pool-map-preview__close"
        onClick={onClose}
        aria-label="닫기"
      >
        <X size={18} />
      </button>

      <button
        type="button"
        className="pool-map-preview__card"
        onClick={handleOpenDetail}
      >
        <div className="pool-map-preview__icon" aria-hidden>
          🏊
        </div>
        <div className="pool-map-preview__body">
          <h3 className="pool-map-preview__name">{pool.name}</h3>
          <p className="pool-map-preview__address">
            <MapPin size={13} aria-hidden />
            <span>{pool.address}</span>
          </p>
          {pool.fee && (
            <p className="pool-map-preview__fee">
              <Coins size={13} aria-hidden />
              <span>{formatPoolFee(pool.fee)}</span>
            </p>
          )}
        </div>
        <ChevronRight className="pool-map-preview__chevron" size={22} aria-hidden />
      </button>
    </div>
  )
}

export default PoolMapPreview
