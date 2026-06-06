import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SearchResultItem from './SearchResultItem';
import { getPoolListKey } from '../../utils/poolKey';
import './SearchResultsPanel.css';

// 시트가 멈추는 두 지점 (뷰포트 상단 기준 px)
const TOP = 50; // 검색바 바로 아래 — 여기까지 올리면 시트가 검색바 아래로 들어간다
const FALLBACK_BAR = 60; // 바 높이 측정 전 기본값
const MOVE_THRESHOLD = 3; // 이 이상 움직여야 드래그로 인정
const VELOCITY_SNAP = 0.5; // px/ms — 이 속도 이상이면 방향대로 스냅

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const getViewportH = () =>
  typeof window !== 'undefined' ? window.innerHeight : 800;
const getBottomNavOffset = () => {
  if (typeof document === 'undefined') return 52;
  const nav = document.querySelector('.bottom-nav');
  return nav?.offsetHeight ?? 52;
};

function SearchResultsPanel({
  pools,
  selectedPool,
  onSelectPool,
  resetKey,
  titlePrefix = '검색 결과',
  countSuffix = '건',
  emptyMessage = '검색 결과가 없습니다',
  ariaLabel = '목록',
}) {
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const barRef = useRef(null);

  // peek = "검색 결과 N건" 바만 화면 하단에 보이는 위치 (바 높이만큼만 노출)
  const [peekTop, setPeekTop] = useState(
    () => getViewportH() - FALLBACK_BAR - getBottomNavOffset(),
  );
  const [translateY, setTranslateYState] = useState(
    () => getViewportH() - FALLBACK_BAR - getBottomNavOffset(),
  );
  const [expanded, setExpandedState] = useState(false);
  const [dragging, setDragging] = useState(false);

  // 드래그 로직에서 최신값을 동기 참조하기 위한 ref들
  const translateRef = useRef(translateY);
  const peekTopRef = useRef(peekTop);
  const expandedRef = useRef(expanded);
  const startYRef = useRef(0);
  const startTranslateRef = useRef(0);
  const movingRef = useRef(false);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  peekTopRef.current = peekTop;

  const setTranslateY = (v) => {
    translateRef.current = v;
    setTranslateYState(v);
  };

  const setExpanded = (v) => {
    expandedRef.current = v;
    setExpandedState(v);
  };

  // peek 위치 = 뷰포트 높이 - 바 높이 (바만 하단에 도킹, 카드는 화면 밖)
  const measurePeek = () => {
    const barH = barRef.current?.offsetHeight ?? FALLBACK_BAR;
    const next = Math.round(getViewportH() - barH - getBottomNavOffset());
    setPeekTop(next);
    if (!movingRef.current && !expandedRef.current) setTranslateY(next);
  };

  useLayoutEffect(() => {
    measurePeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools.length]);

  useEffect(() => {
    const onResize = () => measurePeek();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시트가 열릴 때마다 peek 으로 접는다
  useEffect(() => {
    setExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // 스냅 상태(expanded)·리사이즈와 시트 위치 동기화 (드래그 중 제외)
  useEffect(() => {
    if (movingRef.current) return;
    setTranslateY(expanded ? TOP : peekTop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, peekTop]);

  const updateDrag = (clientY) => {
    const dy = clientY - startYRef.current;
    const next = clamp(startTranslateRef.current + dy, TOP, peekTopRef.current);
    setTranslateY(next);

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    velocityRef.current = (clientY - lastYRef.current) / dt;
    lastYRef.current = clientY;
    lastTimeRef.current = now;
  };

  const endDrag = () => {
    if (!movingRef.current) return;
    movingRef.current = false;
    setDragging(false);

    const peek = peekTopRef.current;
    const mid = (TOP + peek) / 2;
    const v = velocityRef.current;

    let target;
    if (v < -VELOCITY_SNAP) target = TOP;
    else if (v > VELOCITY_SNAP) target = peek;
    else target = translateRef.current < mid ? TOP : peek;

    setTranslateY(target);
    setExpanded(target === TOP);
  };

  // touchmove는 native 스크롤을 막기 위해 non-passive로 직접 등록한다.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      const dy = y - startYRef.current;

      if (!movingRef.current) {
        const listAtTop = (listRef.current?.scrollTop ?? 0) <= 0;
        // 접힘 상태: 어느 방향이든 시트를 끈다.
        // 펼침 상태: 리스트 최상단에서 "아래로" 당길 때만 시트를 끈다(그 외엔 일반 스크롤).
        const shouldMove = !expandedRef.current ? true : listAtTop && dy > 0;
        if (!shouldMove || Math.abs(dy) < MOVE_THRESHOLD) return;

        movingRef.current = true;
        setDragging(true);
        lastYRef.current = y;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }

      e.preventDefault();
      updateDrag(y);
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
    startTranslateRef.current = translateRef.current;
    movingRef.current = false;
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  // 데스크톱(마우스) 드래그: 바에서 시작 (이동 임계값을 넘겨야 드래그로 인정 → 클릭과 구분)
  const handleMouseDown = (e) => {
    e.preventDefault();
    startYRef.current = e.clientY;
    startTranslateRef.current = translateRef.current;
    movingRef.current = false;
    let committed = false;

    const onMove = (ev) => {
      const dy = ev.clientY - startYRef.current;
      if (!committed) {
        if (Math.abs(dy) < MOVE_THRESHOLD) return;
        committed = true;
        movingRef.current = true;
        setDragging(true);
        lastYRef.current = ev.clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }
      updateDrag(ev.clientY);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      endDrag();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleOpenDetail = (pool) => {
    onSelectPool?.(pool);
  };

  return (
    <section
      ref={sectionRef}
      className={`search-results-panel ${expanded ? 'is-expanded' : ''} ${
        dragging ? 'is-dragging' : ''
      }`}
      style={{ transform: `translateY(${translateY}px)` }}
      aria-label={ariaLabel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={barRef}
        className="search-results-panel__peek-bar"
        onMouseDown={handleMouseDown}
        onClick={() => !dragging && setExpanded(!expandedRef.current)}
        role="presentation"
      >
        <span className="search-results-panel__handle" aria-hidden />
        <header className="search-results-panel__header">
          <h2 className="search-results-panel__title">
            {titlePrefix}{' '}
            <span className="search-results-panel__count">{pools.length}</span>
            {countSuffix}
          </h2>
        </header>
      </div>

      <div ref={listRef} className="search-results-panel__list" role="list">
        {pools.length === 0 ? (
          <p className="search-results-panel__empty">{emptyMessage}</p>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <SearchResultItem
                pool={pool}
                selected={selectedKey === getPoolListKey(pool)}
                onSelect={handleOpenDetail}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default SearchResultsPanel;
