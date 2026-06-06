import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { getPoolListKey } from '../utils/poolKey';

const STORAGE_KEY = 'ah-poo:favorites';
const EMPTY_FAVORITES = [];

const listeners = new Set();
let cachedRaw = null;
let cachedSnapshot = EMPTY_FAVORITES;

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
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

function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_FAVORITES;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw);
    cachedSnapshot = Array.isArray(parsed) ? parsed : EMPTY_FAVORITES;
    return cachedSnapshot;
  } catch {
    cachedRaw = '';
    cachedSnapshot = EMPTY_FAVORITES;
    return cachedSnapshot;
  }
}

function writeFavorites(pools) {
  const raw = JSON.stringify(pools);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = pools;
  emit();
}

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const favorites = useSyncExternalStore(subscribe, readFavorites, () => EMPTY_FAVORITES);

  const favoriteKeys = useMemo(
    () => new Set(favorites.map(getPoolListKey)),
    [favorites],
  );

  const isFavorite = useCallback(
    (pool) => favoriteKeys.has(getPoolListKey(pool)),
    [favoriteKeys],
  );

  const toggleFavorite = useCallback((pool) => {
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
