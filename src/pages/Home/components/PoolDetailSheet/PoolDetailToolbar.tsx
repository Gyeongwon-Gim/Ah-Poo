import { Star, X, ChevronLeft } from 'lucide-react';
import type { MouseEvent, PointerEvent } from 'react';
import type { Pool } from '@/types/pool';

interface PoolDetailToolbarProps {
  favorite: boolean;
  onToggleFavorite: (pool: Pool) => void;
  pool: Pool;
  onBack: () => void;
  onClose: () => void;
  onPointerDownStop: (e: PointerEvent | MouseEvent) => void;
}

export default function PoolDetailToolbar({
  favorite,
  onToggleFavorite,
  pool,
  onBack,
  onClose,
  onPointerDownStop,
}: PoolDetailToolbarProps) {
  return (
    <div className="pool-sheet__toolbar">
      <button
        type="button"
        className="pool-sheet__back"
        onClick={onBack}
        onPointerDown={onPointerDownStop}
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={30} strokeWidth={1.5} aria-hidden />
      </button>
      <div className="pool-sheet__head-actions">
        <button
          type="button"
          className={`pool-sheet__round ${
            favorite ? 'pool-sheet__round--active' : ''
          }`}
          onClick={() => onToggleFavorite(pool)}
          onPointerDown={onPointerDownStop}
          aria-label="즐겨찾기"
          aria-pressed={favorite}
        >
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="pool-sheet__round"
          onClick={onClose}
          onPointerDown={onPointerDownStop}
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
