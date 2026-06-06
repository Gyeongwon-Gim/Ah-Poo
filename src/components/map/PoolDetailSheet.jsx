import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Star,
  X,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Navigation,
  Share2,
  Globe,
  Link as LinkIcon,
} from 'lucide-react';
import { formatDailyAdmissionFee } from '../../utils/formatFee';
import { isFlagOn } from '../../services/pools';
import { useFavorites } from '../../hooks/useFavorites';
import PoolThumbnails from '../PoolThumbnails';
import PoolScheduleTags from '../PoolScheduleTags';
import './PoolDetailSheet.css';

const CLOSE_THRESHOLD = 96;
const ENTER_MS = 340;
const CLOSE_MS = ENTER_MS;
const TAP_TOLERANCE = 6;

function PoolDetailSheet({ pool, onClose, instantEnter = false }) {
  const sheetRef = useRef(null);
  const grabberRef = useRef(null);
  const dragRef = useRef(null);
  const peekRef = useRef(0);
  const [sheetH, setSheetH] = useState(0);
  const [detent, setDetent] = useState('peek');
  const [translate, setTranslate] = useState(0);
  const [phase, setPhase] = useState('entering');
  const [dragging, setDragging] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);

  // pool 이 새로 선택될 때마다 CSS keyframe으로 아래에서 peek 위치로 슬라이드 업한다.
  useLayoutEffect(() => {
    const el = sheetRef.current;
    const grab = grabberRef.current;
    if (!el || !grab) return;

    const h = el.offsetHeight;
    const peek = grab.offsetHeight;
    const peekTop = h - peek;

    peekRef.current = peek;
    setSheetH(h);
    setDetent('peek');
    setTranslate(peekTop);
    el.style.setProperty('--peek-h', `${peek}px`);

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (instantEnter || reducedMotion) {
      setPhase('interactive');
      return;
    }

    setPhase('entering');

    const fallback = window.setTimeout(
      () => setPhase('interactive'),
      ENTER_MS + 80,
    );
    return () => window.clearTimeout(fallback);
  }, [pool, instantEnter]);

  const handleEnterEnd = useCallback((e) => {
    if (e.target !== sheetRef.current) return;
    if (e.animationName !== 'pool-sheet-enter') return;
    setPhase('interactive');
  }, []);

  const handleClose = useCallback(() => {
    const h = sheetRef.current?.offsetHeight ?? sheetH;
    setPhase('exiting');
    setTranslate(h);
    window.setTimeout(onClose, CLOSE_MS);
  }, [sheetH, onClose]);

  const snapTo = useCallback(
    (next) => {
      if (next === 'full') {
        setDetent('full');
        setTranslate(0);
      } else {
        setDetent('peek');
        setTranslate(sheetH - peekRef.current);
      }
    },
    [sheetH],
  );

  const onPointerDown = (e) => {
    if (phase !== 'interactive') return;

    dragRef.current = {
      startY: e.clientY,
      startTranslate: translate,
      moved: 0,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = e.clientY - drag.startY;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    const next = Math.max(0, Math.min(sheetH, drag.startTranslate + delta));
    setTranslate(next);
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag) return;

    if (drag.moved < TAP_TOLERANCE) {
      snapTo(detent === 'full' ? 'peek' : 'full');
      return;
    }

    const visible = sheetH - translate;
    if (visible < CLOSE_THRESHOLD) {
      handleClose();
      return;
    }

    const mid = (peekRef.current + sheetH) / 2;
    snapTo(visible >= mid ? 'full' : 'peek');
  };

  if (!pool) return null;

  const hasSchedule =
    isFlagOn(pool.is50m) ||
    isFlagOn(pool.isWeekday) ||
    isFlagOn(pool.isSaturday) ||
    isFlagOn(pool.isSunday) ||
    isFlagOn(pool.isHoliday);

  const distanceLabel =
    typeof pool.distanceKm === 'number'
      ? `${pool.distanceKm.toFixed(1)}km`
      : null;

  const handleDirections = () => {
    const url = `https://map.kakao.com/link/map/${pool.name},${pool.lat},${pool.lng}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: pool.name,
      text: `${pool.name} · ${pool.address}`,
      url: pool.url || window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      /* 사용자가 공유를 취소함 */
    }
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      ref={sheetRef}
      className={`pool-sheet ${
        phase === 'entering' ? 'pool-sheet--entering' : ''
      } ${
        (phase === 'interactive' || phase === 'exiting') && !dragging
          ? 'pool-sheet--transition'
          : ''
      } ${dragging ? 'pool-sheet--dragging' : ''}`}
      style={
        phase === 'entering'
          ? undefined
          : { transform: `translateY(${translate}px)` }
      }
      onAnimationEnd={handleEnterEnd}
      role="dialog"
      aria-label={`${pool.name} 상세`}
    >
      <div
        ref={grabberRef}
        className="pool-sheet__grabber"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="pool-sheet__handle" aria-hidden />

        <div className="pool-sheet__head">
          <div className="pool-sheet__toolbar">
            <button
              type="button"
              className="pool-sheet__back"
              onClick={handleClose}
              onPointerDown={stop}
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
                onClick={() => toggleFavorite(pool)}
                onPointerDown={stop}
                aria-label="즐겨찾기"
                aria-pressed={favorite}
              >
                <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className="pool-sheet__round"
                onClick={handleClose}
                onPointerDown={stop}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="pool-sheet__titles">
            <h2 className="pool-sheet__name">{pool.name}</h2>
            <p className="pool-sheet__meta">
              <span>수영장</span>
              {pool.fee && (
                <>
                  <span className="pool-sheet__dot">·</span>
                  <span className="pool-sheet__meta-fee">
                    {formatDailyAdmissionFee(pool.fee)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="pool-sheet__location">
          <MapPin size={14} aria-hidden />
          {distanceLabel && (
            <span className="pool-sheet__distance">{distanceLabel}</span>
          )}
          <span className="pool-sheet__address">{pool.address}</span>
          <ChevronDown size={15} className="pool-sheet__location-caret" />
        </p>

        <div className="pool-sheet__actions" onPointerDown={stop}>
          <button
            type="button"
            className="pool-sheet__action pool-sheet__action--primary"
            onClick={handleDirections}
          >
            <Navigation size={18} />
            <span>길찾기</span>
          </button>
          <button
            type="button"
            className="pool-sheet__action"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span>공유</span>
          </button>
          {pool.url && (
            <a
              className="pool-sheet__action"
              href={pool.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={18} />
              <span>사이트</span>
            </a>
          )}
          {pool.url2 && (
            <a
              className="pool-sheet__action"
              href={pool.url2}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkIcon size={18} />
              <span>링크</span>
            </a>
          )}
        </div>

        <PoolThumbnails
          className="pool-thumbs--sheet"
          onPointerDown={stop}
        />
      </div>

      <div className="pool-sheet__detail">
        <div className="pool-sheet__tabs">
          <span className="pool-sheet__tab pool-sheet__tab--active">정보</span>
        </div>

        <section className="pool-sheet__section">
          <p>
            {pool.fee ? formatDailyAdmissionFee(pool.fee) : '일일입장 정보 없음'}
          </p>
        </section>

        <section className="pool-sheet__section">
          <h3>운영정보</h3>
          <PoolScheduleTags pool={pool} />
          {!hasSchedule && (
            <p className="pool-sheet__empty">등록된 운영 정보가 없습니다.</p>
          )}
        </section>

        {(pool.url || pool.url2) && (
          <section className="pool-sheet__section pool-sheet__links">
            {pool.url && (
              <a
                href={pool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pool-sheet__link"
              >
                공식 사이트
              </a>
            )}
            {pool.url2 && (
              <a
                href={pool.url2}
                target="_blank"
                rel="noopener noreferrer"
                className="pool-sheet__link pool-sheet__link--secondary"
              >
                추가 링크
              </a>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default PoolDetailSheet;
