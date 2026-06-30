import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { getPoolListKey } from '../utils/poolKey';
import type { Pool } from '../types/pool';

const STORAGE_KEY = 'ah-poo:favorites';
const EMPTY_FAVORITES: Pool[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSnapshot: Pool[] = EMPTY_FAVORITES;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cachedRaw = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function readFavorites(): Pool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_FAVORITES;
      return cachedSnapshot;
    }

    const parsed: unknown = JSON.parse(raw);
    cachedSnapshot = Array.isArray(parsed) ? (parsed as Pool[]) : EMPTY_FAVORITES;
    return cachedSnapshot;
  } catch {
    cachedRaw = '';
    cachedSnapshot = EMPTY_FAVORITES;
    return cachedSnapshot;
  }
}

function writeFavorites(pools: Pool[]) {
  const raw = JSON.stringify(pools);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = pools;
  emit();
}

interface FavoritesContextValue {
  favorites: Pool[];
  isFavorite: (pool: Pool) => boolean;
  toggleFavorite: (pool: Pool) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favorites = useSyncExternalStore(
    subscribe,
    readFavorites,
    () => EMPTY_FAVORITES,
  );

  const favoriteKeys = useMemo(
    () => new Set(favorites.map(getPoolListKey)),
    [favorites],
  );

  const isFavorite = useCallback(
    (pool: Pool) => favoriteKeys.has(getPoolListKey(pool)),
    [favoriteKeys],
  );

  const toggleFavorite = useCallback((pool: Pool) => {
    const key = getPoolListKey(pool);
    const current = readFavorites();
    const exists = current.some((p) => getPoolListKey(p) === key);
    writeFavorites(
      exists
        ? current.filter((p) => getPoolListKey(p) !== key)
        : [...current, pool],
    );
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
