import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

// Home 화면에서 서로 배타적으로 열리는 필터/패널들. 새 필터(예: 호텔 수영장)를
// 추가할 때는 이 유니온에 키를 더하고 아래 actions에 open/close/toggle 세 줄만 추가하면 된다.
type PoolFilterKey = 'favorites' | 'nearby' | '50m';

interface PoolFilterContextValue {
  favoritesOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavorites: () => void;
  nearbyOpen: boolean;
  openNearby: () => void;
  closeNearby: () => void;
  toggleNearby: () => void;
  show50mOnly: boolean;
  open50m: () => void;
  close50m: () => void;
  toggle50m: () => void;
}

const PoolFilterContext = createContext<PoolFilterContextValue | null>(null);

export function PoolFilterProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<PoolFilterKey | null>(null);

  const open = useCallback(
    (key: PoolFilterKey, navigateHome: boolean) => {
      if (navigateHome) navigate('/');
      setActiveFilter(key);
    },
    [navigate],
  );

  const close = useCallback((key: PoolFilterKey) => {
    setActiveFilter((current) => (current === key ? null : current));
  }, []);

  const toggle = useCallback(
    (key: PoolFilterKey, navigateHome: boolean) => {
      if (navigateHome) navigate('/');
      setActiveFilter((current) => (current === key ? null : key));
    },
    [navigate],
  );

  // 액션 함수들은 activeFilter가 바뀌어도 재생성되지 않도록 boolean 플래그와 분리해 메모이즌한다 —
  // 소비 측이 이 함수들을 effect/callback 의존성 배열에 넣기 때문에 정체성이 안정적이어야 한다.
  const actions = useMemo(
    () => ({
      openFavorites: () => open('favorites', true),
      closeFavorites: () => close('favorites'),
      toggleFavorites: () => toggle('favorites', true),
      openNearby: () => open('nearby', true),
      closeNearby: () => close('nearby'),
      toggleNearby: () => toggle('nearby', true),
      open50m: () => open('50m', false),
      close50m: () => close('50m'),
      toggle50m: () => toggle('50m', false),
    }),
    [open, close, toggle],
  );

  const value = useMemo<PoolFilterContextValue>(
    () => ({
      favoritesOpen: activeFilter === 'favorites',
      nearbyOpen: activeFilter === 'nearby',
      show50mOnly: activeFilter === '50m',
      ...actions,
    }),
    [activeFilter, actions],
  );

  return (
    <PoolFilterContext.Provider value={value}>
      {children}
    </PoolFilterContext.Provider>
  );
}

export function usePoolFilter() {
  const ctx = useContext(PoolFilterContext);
  if (!ctx) {
    throw new Error('usePoolFilter must be used within PoolFilterProvider');
  }
  return ctx;
}
