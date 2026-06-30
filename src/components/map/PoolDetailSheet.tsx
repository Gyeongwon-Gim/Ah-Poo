import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Star,
  X,
  ChevronLeft,
  Navigation,
  Share2,
  Home,
  Copy,
  Phone,
} from 'lucide-react';
import { formatDailyAdmissionFee } from '../../utils/formatFee';
import { formatDistanceKmLabel } from '../../utils/formatDistance';
import { buildKakaoDirectionsUrl } from '../../utils/kakaoDirectionsUrl';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { usePoolImageUrl } from '../../hooks/usePoolImageUrl';
import { useFavorites } from '../../hooks/useFavorites';
import {
  fetchPoolBlogReview,
  formatPostDate,
  type PoolBlogReviewItem,
} from '../../services/naverBlog';
import type { Pool } from '../../types/pool';
import './PoolDetailSheet.css';

const CLOSE_THRESHOLD = 96;
const ENTER_MS = 340;
const CLOSE_MS = ENTER_MS;

interface PoolDetailSheetProps {
  pool: Pool;
  onClose: () => void;
  onCloseStart?: () => void;
  onBack?: () => void;
  onBackStart?: () => void;
  instantEnter?: boolean;
  onTopChange?: (top: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export default function PoolDetailSheet({
  pool,
  onClose,
  onCloseStart,
  onBack,
  onBackStart,
  instantEnter = false,
  onTopChange,
  onDragChange,
}: PoolDetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef(0);
  const translateLockedRef = useRef(false);
  const anchorHeightRef = useRef(0);
  const anchorTranslateRef = useRef(0);
  const [sheetH, setSheetH] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'interactive' | 'exiting'>(
    'entering',
  );
  const [snapTransition, setSnapTransition] = useState(false);
  const snapTransitionTimerRef = useRef<number | undefined>(undefined);
  const onTopChangeRef = useRef(onTopChange);
  const handleCloseRef = useRef<() => void>(() => {});
  const snapToPeekWithTransitionRef = useRef<() => void>(() => {});
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pool);
  const [blogReview, setBlogReview] = useState<PoolBlogReviewItem | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogThumbFailed, setBlogThumbFailed] = useState(false);
  const [blogRetryKey, setBlogRetryKey] = useState(0);
  const { poolImageUrl } = usePoolImageUrl(pool.id);

  const snapPoints = useMemo(
    () => ({
      full: 0,
      peek: Math.max(0, sheetH - peekRef.current),
    }),
    [sheetH],
  );

  const {
    translate,
    setTranslate,
    translateRef,
    dragging,
    grabberHandlers,
    snapToPeek,
  } = useBottomSheet({
    maxTranslate: sheetH,
    snapPoints,
    closeThreshold: CLOSE_THRESHOLD,
    enabled: phase === 'interactive',
    onDragChange,
    onAfterDrag: ({ visible }) => {
      if (visible < CLOSE_THRESHOLD) {
        handleCloseRef.current();
        return;
      }
      snapToPeekWithTransitionRef.current();
    },
  });

  const captureAnchor = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    anchorHeightRef.current = el.offsetHeight;
    anchorTranslateRef.current = translateRef.current;
  }, [translateRef]);

  const applyLockedLayout = useCallback((el: HTMLElement, h: number) => {
    const nextTranslate =
      anchorTranslateRef.current + (h - anchorHeightRef.current);
    translateRef.current = nextTranslate;
    el.style.transform = `translate(-50%, ${nextTranslate}px)`;
  }, [translateRef]);

  const snapToPeekWithTransition = useCallback(() => {
    setSnapTransition(true);
    if (snapTransitionTimerRef.current) {
      window.clearTimeout(snapTransitionTimerRef.current);
    }
    snapTransitionTimerRef.current = window.setTimeout(() => {
      setSnapTransition(false);
      snapTransitionTimerRef.current = undefined;
    }, CLOSE_MS);
    snapToPeek();
    if (translateLockedRef.current) {
      captureAnchor(sheetRef.current);
    }
  }, [captureAnchor, snapToPeek]);

  snapToPeekWithTransitionRef.current = snapToPeekWithTransition;

  const runDismiss = useCallback(
    (start?: () => void, done?: () => void) => {
      start?.();
      const h = sheetRef.current?.offsetHeight ?? sheetH;
      setPhase('exiting');
      setTranslate(h);
      window.setTimeout(() => done?.(), CLOSE_MS);
    },
    [sheetH, setTranslate],
  );

  const handleBack = useCallback(() => {
    runDismiss(onBackStart, onBack ?? onClose);
  }, [runDismiss, onBackStart, onBack, onClose]);

  const handleClose = useCallback(() => {
    runDismiss(onCloseStart, onClose);
  }, [runDismiss, onCloseStart, onClose]);

  handleCloseRef.current = handleClose;

  useEffect(() => {
    if (!pool) return undefined;

    const controller = new AbortController();
    setBlogReview(null);
    setBlogError(null);
    setBlogThumbFailed(false);
    setBlogLoading(true);

    fetchPoolBlogReview(pool, { signal: controller.signal })
      .then((review) => {
        if (!controller.signal.aborted) {
          setBlogReview(review);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setBlogError(
          err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setBlogLoading(false);
        }
      });

    return () => controller.abort();
  }, [pool, blogRetryKey]);

  useEffect(
    () => () => {
      if (snapTransitionTimerRef.current) {
        window.clearTimeout(snapTransitionTimerRef.current);
      }
    },
    [],
  );

  onTopChangeRef.current = onTopChange;

  const reportTop = useCallback(() => {
    const el = sheetRef.current;
    if (!el || !onTopChangeRef.current) return;
    onTopChangeRef.current(el.getBoundingClientRect().top);
  }, []);

  useEffect(() => {
    reportTop();
  }, [translate, phase, reportTop]);

  useEffect(() => {
    if (phase !== 'entering' || !onTopChangeRef.current) return undefined;

    let raf = 0;
    const tick = () => {
      reportTop();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reportTop]);

  useEffect(() => {
    if (!onTopChangeRef.current) return undefined;
    const el = sheetRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => reportTop());
    ro.observe(el);
    return () => ro.disconnect();
  }, [pool, reportTop]);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    const grab = grabberRef.current;
    if (!el || !grab) return;

    translateLockedRef.current = false;

    const measure = () => {
      const h = el.offsetHeight;
      const peek = Math.min(grab.offsetHeight, h);
      const peekTop = Math.max(0, h - peek);

      setSheetH(h);

      if (!translateLockedRef.current) {
        peekRef.current = peek;
        setTranslate(peekTop);
        el.style.setProperty('--peek-h', `${peek}px`);
        return;
      }

      applyLockedLayout(el, h);
    };

    measure();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (instantEnter || reducedMotion) {
      setPhase('interactive');
      translateLockedRef.current = true;
      captureAnchor(el);
    } else {
      setPhase('entering');
    }

    const fallback =
      instantEnter || reducedMotion
        ? undefined
        : window.setTimeout(() => {
            setPhase('interactive');
            translateLockedRef.current = true;
            captureAnchor(el);
          }, ENTER_MS + 80);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    resizeObserver?.observe(grab);

    const onScreenResize = () => {
      translateLockedRef.current = false;
      measure();
      translateLockedRef.current = true;
      captureAnchor(el);
    };

    window.addEventListener('screen-resize', onScreenResize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('screen-resize', onScreenResize);
      if (fallback) window.clearTimeout(fallback);
    };
  }, [
    pool,
    instantEnter,
    applyLockedLayout,
    captureAnchor,
    setTranslate,
  ]);

  const handleEnterEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== sheetRef.current) return;
      if (e.animationName !== 'pool-sheet-enter') return;
      setPhase('interactive');
      translateLockedRef.current = true;
      captureAnchor(sheetRef.current);
    },
    [captureAnchor],
  );

  if (!pool) return null;

  const distanceLabel =
    typeof pool.distanceKm === 'number'
      ? formatDistanceKmLabel(pool.distanceKm)
      : null;

  const handleDirections = () => {
    window.open(buildKakaoDirectionsUrl(pool), '_blank');
  };

  const handleShare = async () => {
    const shareUrl = pool.id
      ? `${window.location.origin}/pool/${pool.id}`
      : window.location.href;
    const shareData = {
      title: pool.name,
      text: `${pool.name} · ${pool.roadAddress}`,
      url: shareUrl,
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

  const handleCopyAddress = async () => {
    if (!pool.roadAddress) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pool.roadAddress);
      }
    } catch {
      /* 복사 취소 또는 권한 거부 */
    }
  };

  const stop = (e: React.PointerEvent | React.MouseEvent) =>
    e.stopPropagation();

  return (
    <div
      ref={sheetRef}
      className={`pool-sheet ${
        phase === 'entering' ? 'pool-sheet--entering' : ''
      } ${
        (phase === 'exiting' || snapTransition) && !dragging
          ? 'pool-sheet--transition'
          : ''
      } ${dragging ? 'pool-sheet--dragging' : ''}`}
      style={
        phase === 'entering'
          ? undefined
          : { transform: `translate(-50%, ${translateRef.current}px)` }
      }
      onAnimationEnd={handleEnterEnd}
      role="dialog"
      aria-label={`${pool.name} 상세`}
    >
      <div
        ref={grabberRef}
        className="pool-sheet__grabber"
        {...grabberHandlers}
      >
        <span className="pool-sheet__handle" aria-hidden />

        <div className="pool-sheet__head">
          <div className="pool-sheet__toolbar">
            <button
              type="button"
              className="pool-sheet__back"
              onClick={handleBack}
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

          {poolImageUrl && (
            <div className="pool-sheet__hero-wrap" onPointerDown={stop}>
              <img
                className="pool-sheet__hero"
                src={poolImageUrl}
                alt=""
                loading="lazy"
              />
            </div>
          )}

          <div className="pool-sheet__titles">
            <h2 className="pool-sheet__name">{pool.name}</h2>
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
            <span className="pool-sheet__distance">{distanceLabel}</span>
          )}
          <span className="pool-sheet__address-wrap">
            <span className="pool-sheet__address">{pool.roadAddress}</span>
            <button
              type="button"
              className="pool-sheet__copy-address"
              onClick={handleCopyAddress}
              onPointerDown={stop}
              aria-label="주소 복사"
            >
              <Copy size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </span>
        </div>

        {pool.phone && (
          <div onPointerDown={stop}>
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

        <div className="pool-sheet__actions" onPointerDown={stop}>
          {pool.official_url && (
            <a
              className="pool-sheet__action"
              href={pool.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Home size={18} />
              <span>홈페이지</span>
            </a>
          )}
          <button
            type="button"
            className="pool-sheet__action"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span>공유</span>
          </button>
          <button
            type="button"
            className="pool-sheet__action pool-sheet__action--primary"
            onClick={handleDirections}
          >
            <Navigation size={18} />
            <span>길찾기</span>
          </button>
        </div>

        <section
          className="pool-sheet__blog"
          onPointerDown={stop}
          aria-live="polite"
        >
          <h3 className="pool-sheet__blog-title">블로그 리뷰</h3>
          {blogLoading && (
            <p className="pool-sheet__blog-status">리뷰를 불러오는 중…</p>
          )}
          {!blogLoading && blogError && (
            <div className="pool-sheet__blog-error">
              <p className="pool-sheet__blog-status pool-sheet__blog-status--error">
                {blogError}
              </p>
              <button
                type="button"
                className="pool-sheet__blog-retry"
                onClick={() => setBlogRetryKey((key) => key + 1)}
              >
                다시 시도
              </button>
            </div>
          )}
          {!blogLoading && !blogError && blogReview && (
            <a
              className="pool-sheet__blog-card"
              href={blogReview.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {blogReview.thumbnailUrl && !blogThumbFailed && (
                <img
                  className="pool-sheet__blog-thumb"
                  src={blogReview.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  onError={() => setBlogThumbFailed(true)}
                />
              )}
              <span className="pool-sheet__blog-body">
                <span className="pool-sheet__blog-link">{blogReview.title}</span>
                {blogReview.description && (
                  <span className="pool-sheet__blog-desc">
                    {blogReview.description}
                  </span>
                )}
                <span className="pool-sheet__blog-meta">
                  {blogReview.bloggerName}
                  {blogReview.postDate && (
                    <>
                      <span className="pool-sheet__blog-meta-dot">·</span>
                      {formatPostDate(blogReview.postDate)}
                    </>
                  )}
                </span>
              </span>
            </a>
          )}
          {!blogLoading && !blogError && !blogReview && (
            <p className="pool-sheet__blog-status">관련 리뷰를 찾지 못했어요</p>
          )}
          <p className="pool-sheet__blog-attribution">검색 결과 제공: NAVER</p>
        </section>
      </div>
    </div>
  );
}
