import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SearchResultItem from './SearchResultItem';
import { getPoolListKey } from '../../utils/poolKey';
import './SearchResultsPanel.css';

// 시트가 멈추는 두 지점 (뷰포트 상단 기준 px)
const TOP = 50; // 검색바 바로 아래 — 여기까지 올리면 시트가 검색바 아래로 들어간다
const FALLBACK_PEEK = 200; // 바 + 첫 카드 측정 전 기본값
const MOVE_THRESHOLD = 3; // 이 이상 움직여야 드래그로 인정
const VELOCITY_SNAP = 0.5; // px/ms — 이 속도 이상이면 방향대로 스냅
const PEEK_OVERSCROLL = 48; // softSheet: peek 아래 고무줄 (이 안이면 peek으로 복귀)
const DISMISS_DRAG_MIN = 72; // softSheet: peek 아래 이만큼 내려야 닫힘
const DISMISS_VELOCITY = 1.15; // softSheet: peek 근처에서 아래로 빠르게 플릭 시 닫힘
const SOFT_EXPAND_RATIO = 0.28; // softSheet: 상단 이 비율까지 올려야 fully expanded
const SOFT_COLLAPSE_RATIO = 0.72; // softSheet: 하단 이 비율 아래면 peek으로

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function readCssVarPx(varName) {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:var(' +
    varName +
    ')';
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}
const getContainerH = (el) => {
  if (typeof document === 'undefined') return 800;
  const vv = window.visualViewport?.height;
  if (vv) return Math.round(vv);
  const home = el?.closest?.('.home') ?? document.querySelector('.home');
  return home?.clientHeight ?? window.innerHeight;
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
  behindDetail = false,
  behindDetailInstant = false,
  revealFromDetail = false,
  interactionDisabled = false,
  reservePeekWhenEmpty = false,
  liftPeekForNav = false,
  enterFromBottom = false,
  softSheet = false,
  onExpandedChange,
  onDismissStart,
  onDismiss,
}) {
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null;

  const sectionRef = useRef(null);
  const listRef = useRef(null);
  const barRef = useRef(null);
  const behindDetailRef = useRef(behindDetail);
  const revealFromDetailRef = useRef(revealFromDetail);

  behindDetailRef.current = behindDetail;
  revealFromDetailRef.current = revealFromDetail;

  // peek = 헤더 바 + 첫 검색 결과 1건이 화면 하단에 보이는 위치
  const [peekTop, setPeekTop] = useState(() => getContainerH() - FALLBACK_PEEK);
  const [translateY, setTranslateYState] = useState(() =>
    enterFromBottom ? getContainerH() : getContainerH() - FALLBACK_PEEK,
  );
  const [expanded, setExpandedState] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

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
  const touchOriginRef = useRef('section');
  const listScrollTopAtStartRef = useRef(0);
  const onDismissRef = useRef(onDismiss);
  const onDismissStartRef = useRef(onDismissStart);
  const dismissingRef = useRef(false);
  const enteringRef = useRef(enterFromBottom);
  const softSheetRef = useRef(softSheet);

  softSheetRef.current = softSheet;

  onDismissRef.current = onDismiss;
  onDismissStartRef.current = onDismissStart;

  peekTopRef.current = peekTop;

  const setTranslateY = (v) => {
    translateRef.current = v;
    setTranslateYState(v);
  };

  const setInstant = (instant) => {
    sectionRef.current?.classList.toggle('is-instant', instant);
  };

  const hiddenTranslateY = () => getContainerH(sectionRef.current);

  const getDragMaxY = () => {
    const peek = peekTopRef.current;
    if (softSheetRef.current && onDismissRef.current) return hiddenTranslateY();
    if (softSheetRef.current) return peek + PEEK_OVERSCROLL;
    if (onDismissRef.current) return hiddenTranslateY();
    return peek;
  };

  const isRaisedEnoughForListScroll = (y = translateRef.current) =>
    expandedRef.current || y <= TOP + 8;

  const isListScrollActive = () => {
    if (!softSheetRef.current || !isRaisedEnoughForListScroll()) return false;
    const list = listRef.current;
    if (!list) return false;
    return list.scrollHeight > list.clientHeight + 1;
  };

  const dismissSheet = () => {
    if (dismissingRef.current || !onDismissRef.current) return;
    dismissingRef.current = true;
    onDismissStartRef.current?.();
    setExpanded(false);
    setInstant(false);
    setTranslateY(hiddenTranslateY());
    window.setTimeout(() => {
      onDismissRef.current?.();
      dismissingRef.current = false;
    }, 380);
  };

  const setExpanded = (v) => {
    expandedRef.current = v;
    setExpandedState(v);
    onExpandedChange?.(v);
  };

  const resetListScroll = () => {
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // peek 위치 = 뷰포트 높이 - (바 + 첫 결과 카드) 높이
  const measurePeek = () => {
    const barH = barRef.current?.offsetHeight ?? 60;
    const firstItemEl = listRef.current?.firstElementChild;
    const useFirstSlot =
      pools.length > 0 || (reservePeekWhenEmpty && pools.length === 0);
    const firstItemH =
      useFirstSlot && firstItemEl ? firstItemEl.offsetHeight : 0;
    const navLift = liftPeekForNav ? readCssVarPx('--sheet-bottom-reserve') : 0;
    const peekVisibleH = barH + firstItemH + navLift;
    const next = Math.round(getContainerH(sectionRef.current) - peekVisibleH);
    setPeekTop(next);
    if (
      !movingRef.current &&
      !expandedRef.current &&
      !behindDetailRef.current &&
      !dismissingRef.current &&
      !enteringRef.current
    ) {
      const current = translateRef.current;
      const peek = next;
      const atPeek = Math.abs(current - peek) < 2;
      if (atPeek) setTranslateY(peek);
    }
  };

  useLayoutEffect(() => {
    measurePeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools, reservePeekWhenEmpty]);

  // 첫 카드(썸네일 등) 레이아웃 변화 시 peek 높이 재측정
  useEffect(() => {
    const bar = barRef.current;
    const firstItem = listRef.current?.firstElementChild;
    if (!bar && !firstItem) return undefined;

    const ro = new ResizeObserver(() => measurePeek());
    if (bar) ro.observe(bar);
    if (firstItem) ro.observe(firstItem);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools]);

  useEffect(() => {
    const onResize = () => measurePeek();
    window.addEventListener('resize', onResize);
    window.addEventListener('screen-resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('screen-resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enterFromBottom) setReady(true);
  }, [enterFromBottom]);

  // 시트가 열릴 때마다 peek 으로 접는다
  useEffect(() => {
    setExpanded(false);
    resetListScroll();
    measurePeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // 스냅 상태(expanded)·리사이즈와 시트 위치 동기화 (드래그 중·상세 뒤 숨김·복귀 애니메이션 제외)
  useEffect(() => {
    if (
      movingRef.current ||
      behindDetail ||
      revealFromDetail ||
      dismissingRef.current ||
      enteringRef.current
    ) {
      return;
    }
    if (softSheetRef.current) {
      if (expanded) {
        setTranslateY(TOP);
      } else if (Math.abs(translateRef.current - peekTop) < 2) {
        setTranslateY(peekTop);
        resetListScroll();
      }
      return;
    }
    setTranslateY(expanded ? TOP : peekTop);
    if (!expanded) resetListScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, peekTop, behindDetail, revealFromDetail]);

  // 즐겨찾기 등 — 화면 아래에서 peek 위치로 슬라이드 업
  useLayoutEffect(() => {
    if (!enterFromBottom) return;

    enteringRef.current = true;
    setExpanded(false);
    resetListScroll();
    measurePeek();

    const hidden = hiddenTranslateY();
    setInstant(true);
    setTranslateY(hidden);
    setReady(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setInstant(false);
        setTranslateY(peekTopRef.current);
        enteringRef.current = false;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 상세 시트 열림 → 검색 결과를 화면 아래로 숨김
  useLayoutEffect(() => {
    if (!behindDetail) return;
    setExpanded(false);
    resetListScroll();
    const hidden = hiddenTranslateY();
    if (behindDetailInstant) {
      setInstant(true);
      setTranslateY(hidden);
      requestAnimationFrame(() => setInstant(false));
    } else {
      setTranslateY(hidden);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behindDetail, behindDetailInstant]);

  // 상세 뒤로가기 → 검색 결과가 아래에서 peek 위치로 슬라이드 업
  useLayoutEffect(() => {
    if (!revealFromDetail) return;

    setExpanded(false);
    resetListScroll();
    const hidden = hiddenTranslateY();
    setInstant(true);
    setTranslateY(hidden);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setInstant(false);
        setTranslateY(peekTopRef.current);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealFromDetail]);

  const updateDrag = (clientY) => {
    const dy = clientY - startYRef.current;
    const next = clamp(startTranslateRef.current + dy, TOP, getDragMaxY());
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
    const hidden = hiddenTranslateY();
    const current = translateRef.current;
    const mid = (TOP + peek) / 2;
    const v = velocityRef.current;

    if (softSheetRef.current) {
      const range = peek - TOP;
      const expandLine = TOP + range * SOFT_EXPAND_RATIO;
      const collapseLine = TOP + range * SOFT_COLLAPSE_RATIO;
      const dismissLine = peek + DISMISS_DRAG_MIN;

      if (onDismissRef.current && !dismissingRef.current) {
        if (
          current >= dismissLine ||
          (current > peek + 28 && v > DISMISS_VELOCITY)
        ) {
          dismissSheet();
          return;
        }
      }

      if (current > peek) {
        setTranslateY(peek);
        setExpanded(false);
        resetListScroll();
        return;
      }

      let target;
      if (current <= expandLine) {
        target = TOP;
      } else if (current >= collapseLine) {
        target = peek;
      } else {
        target = current;
      }

      setTranslateY(target);
      setExpanded(target === TOP);
      if (target >= peek - 1) resetListScroll();
      return;
    }

    if (onDismissRef.current && !dismissingRef.current) {
      const dismissThreshold = peek + Math.min(48, (hidden - peek) * 0.15);
      if ((v > VELOCITY_SNAP && current >= peek - 20) || current > dismissThreshold) {
        dismissSheet();
        return;
      }
    }

    let target;
    if (v < -VELOCITY_SNAP) target = TOP;
    else if (v > VELOCITY_SNAP) target = peek;
    else target = current < mid ? TOP : peek;

    setTranslateY(target);
    setExpanded(target === TOP);
    if (target !== TOP) resetListScroll();
  };

  const shouldSheetDrag = (dy) => {
    if (interactionDisabled) return false;
    if (Math.abs(dy) < MOVE_THRESHOLD) return false;

    if (softSheetRef.current && isListScrollActive() && touchOriginRef.current === 'list') {
      const list = listRef.current;
      if (!list) return false;
      const { scrollTop, scrollHeight, clientHeight } = list;
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
      if (dy > 0 && canScrollUp) return false;
      if (dy < 0 && canScrollDown) return false;
    }

    if (!expandedRef.current) return true;

    if (touchOriginRef.current === 'list') {
      if (listScrollTopAtStartRef.current > 0) return false;
      const list = listRef.current;
      if (list && list.scrollTop > 0) return false;
      return dy > 0;
    }

    return touchOriginRef.current === 'bar';
  };

  // touchmove는 native 스크롤을 막기 위해 non-passive로 직접 등록한다.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      const dy = y - startYRef.current;

      if (!movingRef.current) {
        if (!shouldSheetDrag(dy)) return;

        movingRef.current = true;
        setDragging(true);
        lastYRef.current = y;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }

      e.preventDefault();
      updateDrag(y);
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    return () =>
      el.removeEventListener('touchmove', onTouchMove, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = (e) => {
    const target = e.target;
    if (barRef.current?.contains(target)) {
      touchOriginRef.current = 'bar';
    } else if (listRef.current?.contains(target)) {
      touchOriginRef.current = 'list';
    } else {
      touchOriginRef.current = 'section';
    }

    listScrollTopAtStartRef.current = listRef.current?.scrollTop ?? 0;
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

  const listScrollable = isRaisedEnoughForListScroll(translateY);

  return (
    <section
      ref={sectionRef}
      className={`search-results-panel ${ready ? 'is-ready' : ''} ${
        expanded ? 'is-expanded' : ''
      } ${listScrollable ? 'is-list-scrollable' : ''} ${
        dragging ? 'is-dragging' : ''
      } ${interactionDisabled ? 'is-inert' : ''} ${
        revealFromDetail ? 'is-revealing' : ''
      } ${softSheet ? 'is-soft-sheet' : ''}`}
      style={{ transform: `translateY(${translateY}px)` }}
      aria-label={ariaLabel}
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={handleTouchEnd}
      onTouchCancelCapture={handleTouchEnd}
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
          reservePeekWhenEmpty ? (
            <div className="search-results-panel__empty-slot" role="listitem">
              <p className="search-results-panel__empty">{emptyMessage}</p>
            </div>
          ) : (
            <p className="search-results-panel__empty">{emptyMessage}</p>
          )
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
