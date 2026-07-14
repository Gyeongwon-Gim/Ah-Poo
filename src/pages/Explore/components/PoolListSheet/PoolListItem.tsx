import { memo } from 'react';
import { Star } from 'lucide-react';
import ListItem from '@/components/ListItem';
import { Tag } from '@/components';
import PoolStatusTag from '@/components/PoolStatusTag';
import PoolImagePlaceholder from '@/components/PoolImagePlaceholder';
import { useFavorites } from '@/hooks/useFavorites';
import { usePoolImageUrl } from '@/hooks/usePoolImageUrl';
import { isFlagOn } from '@/services/pools';
import { formatDailyAdmissionFee } from '@/utils/formatFee';
import { formatDistance } from '@/utils/formatDistance';
import type { Pool } from '@/types/pool';

interface PoolListItemProps {
  pool: Pool;
  selected: boolean;
  onSelect: (pool: Pool) => void;
}

function PoolListItem({ pool, selected, onSelect }: PoolListItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const distanceLabel = formatDistance(pool.distanceKm);
  const feeLabel = pool.fee ? formatDailyAdmissionFee(pool.fee) : null;
  const { poolImageUrl, poolImageFailed, markPoolImageFailed } =
    usePoolImageUrl(pool.id);
  const show50mTag = isFlagOn(pool.is50m);

  return (
    <ListItem selected={selected} onSelect={() => onSelect(pool)}>
      {poolImageUrl && !poolImageFailed ? (
        <ListItem.Media className="pool-list__media">
          <img
            className="pool-list__media-img"
            src={poolImageUrl}
            alt=""
            loading="lazy"
            onError={markPoolImageFailed}
          />
        </ListItem.Media>
      ) : (
        <ListItem.Media className="pool-list__media" aria-hidden>
          <PoolImagePlaceholder size={20} />
        </ListItem.Media>
      )}

      <ListItem.Body>
        <ListItem.Content>
          <ListItem.TitleRow>
            <ListItem.Title>{pool.name}</ListItem.Title>
            <PoolStatusTag pool={pool} />
            {show50mTag && <Tag variant="highlight">50m</Tag>}
          </ListItem.TitleRow>

          {(feeLabel || distanceLabel) && (
            <ListItem.Subline>
              {feeLabel && (
                <span x-apple-data-detectors="none">{feeLabel}</span>
              )}
              {feeLabel && distanceLabel && (
                <span className="pool-list__dot" aria-hidden>
                  ·
                </span>
              )}
              {distanceLabel && (
                <span x-apple-data-detectors="none">{distanceLabel}</span>
              )}
            </ListItem.Subline>
          )}

          <ListItem.Description x-apple-data-detectors="none">
            {pool.roadAddress}
          </ListItem.Description>
        </ListItem.Content>

        <ListItem.Trailing>
          <button
            type="button"
            className={`pool-list__favorite ${
              favorite ? 'pool-list__favorite--active' : ''
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
        </ListItem.Trailing>
      </ListItem.Body>
    </ListItem>
  );
}

export default memo(PoolListItem);
