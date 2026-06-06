import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Coins } from 'lucide-react';
import { isFlagOn } from '../services/pools';
import { poolToSearchParams } from '../utils/poolKey';
import { formatDailyAdmissionFee } from '../utils/formatFee';
import PoolScheduleTags from './PoolScheduleTags';
import './PoolCard.css';

function PoolCard({ pool }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/pool?${poolToSearchParams(pool)}`, { state: { from: 'pool-card' } });
  };

  return (
    <article
      className="pool-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <div className="pool-card__accent" aria-hidden />
      <div className="pool-card__icon">
        <span className="pool-card__emoji" aria-hidden>
          🦭
        </span>
        {isFlagOn(pool.is50m) && <span className="pool-card__badge">50m</span>}
      </div>

      <div className="pool-card__body">
        <div className="pool-card__top">
          <h3 className="pool-card__name">{pool.name}</h3>
          {/* <ChevronRight className="pool-card__chevron" size={20} aria-hidden /> */}
        </div>

        <p className="pool-card__address">
          <MapPin size={14} className="pool-card__address-icon" aria-hidden />
          <span>{pool.address}</span>
        </p>

        {pool.fee && (
          <p className="pool-card__fee">
            <Coins size={14} aria-hidden />
            <span>{formatDailyAdmissionFee(pool.fee)}</span>
          </p>
        )}

        {/* <PoolScheduleTags pool={pool} /> */}
      </div>
    </article>
  );
}

export default PoolCard;
