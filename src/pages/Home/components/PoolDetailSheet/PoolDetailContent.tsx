import {
  Navigation,
  Share2,
  Home,
  Copy,
  Phone,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { MouseEvent, PointerEvent } from 'react';
import { formatDailyAdmissionFee } from '@/utils/formatFee';
import { isFlagOn } from '@/services/pools';
import type { Pool } from '@/types/pool';

interface PoolDetailContentProps {
  pool: Pool;
  poolImageUrl: string | null;
  poolImageFailed: boolean;
  onPoolImageError: () => void;
  distanceLabel: string | null;
  onCopyAddress: () => void;
  onShare: () => void;
  onDirections: () => void;
  onOpenHomepage?: () => void;
  variant: 'peek' | 'full';
  onPointerDownStop: (e: PointerEvent | MouseEvent) => void;
}

export default function PoolDetailContent({
  pool,
  poolImageUrl,
  poolImageFailed,
  onPoolImageError,
  distanceLabel,
  onCopyAddress,
  onShare,
  onDirections,
  onOpenHomepage,
  variant,
  onPointerDownStop,
}: PoolDetailContentProps) {
  const showExtended = variant === 'full';

  const actions: {
    id: string;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    primary?: boolean;
  }[] = [
    ...(onOpenHomepage
      ? [
          {
            id: 'homepage',
            icon: Home,
            label: '홈페이지',
            onClick: onOpenHomepage,
          },
        ]
      : []),
    { id: 'share', icon: Share2, label: '공유', onClick: onShare },
    {
      id: 'directions',
      icon: Navigation,
      label: '길찾기',
      onClick: onDirections,
      primary: true,
    },
  ];

  return (
    <>
      <div className="pool-sheet__head">
        {poolImageUrl && !poolImageFailed ? (
          <div className="pool-sheet__hero-wrap">
            <img
              className="pool-sheet__hero"
              src={poolImageUrl}
              alt=""
              loading="lazy"
              onError={onPoolImageError}
            />
          </div>
        ) : (
          <div
            className="pool-sheet__hero-wrap pool-sheet__hero-wrap--placeholder"
            aria-hidden
          >
            <Waves size={32} />
          </div>
        )}

        <div className="pool-sheet__titles">
          <div className="pool-sheet__name-row">
            <h2 className="pool-sheet__name">{pool.name}</h2>
            {isFlagOn(pool.is50m) && (
              <span className="pool-sheet__tag pool-sheet__tag--50m">50m</span>
            )}
          </div>
          {pool.fee && (
            <p className="pool-sheet__meta">
              <span className="pool-sheet__meta-fee">
                {formatDailyAdmissionFee(pool.fee)}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="pool-sheet__location">
        {distanceLabel && (
          <span className="pool-sheet__distance" x-apple-data-detectors="none">
            {distanceLabel}
          </span>
        )}
        <span className="pool-sheet__address-wrap">
          <span className="pool-sheet__address" x-apple-data-detectors="none">
            {pool.roadAddress}
          </span>
          <button
            type="button"
            className="pool-sheet__copy-address"
            onClick={onCopyAddress}
            onPointerDown={onPointerDownStop}
            aria-label="주소 복사"
          >
            <Copy size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </span>
      </div>

      {showExtended && pool.phone && (
        <div>
          <a
            className="pool-sheet__contact"
            href={`tel:${String(pool.phone).replace(/\s/g, '')}`}
          >
            <Phone
              size={16}
              strokeWidth={1.75}
              className="pool-sheet__contact-icon"
              aria-hidden
            />
            <span>{pool.phone}</span>
          </a>
        </div>
      )}

      {showExtended && (
        <div className="pool-sheet__actions">
          {actions.map(({ id, icon: Icon, label, onClick, primary }) => (
            <button
              key={id}
              type="button"
              className={`pool-sheet__action${
                primary ? ' pool-sheet__action--primary' : ''
              }`}
              onClick={onClick}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
