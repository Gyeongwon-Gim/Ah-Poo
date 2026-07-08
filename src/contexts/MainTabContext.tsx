import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

interface MainTabContextValue {
  favoritesOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavorites: () => void;
  nearbyOpen: boolean;
  openNearby: () => void;
  closeNearby: () => void;
  toggleNearby: () => void;
}

const MainTabContext = createContext<MainTabContextValue | null>(null);

export function MainTabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);

  const closeFavorites = useCallback(() => {
    setFavoritesOpen(false);
  }, []);

  const closeNearby = useCallback(() => {
    setNearbyOpen(false);
  }, []);

  const openFavorites = useCallback(() => {
    navigate('/');
    setNearbyOpen(false);
    setFavoritesOpen(true);
  }, [navigate]);

  const openNearby = useCallback(() => {
    navigate('/');
    setFavoritesOpen(false);
    setNearbyOpen(true);
  }, [navigate]);

  const toggleFavorites = useCallback(() => {
    navigate('/');
    setFavoritesOpen((open) => {
      const next = !open;
      if (next) setNearbyOpen(false);
      return next;
    });
  }, [navigate]);

  const toggleNearby = useCallback(() => {
    navigate('/');
    setNearbyOpen((open) => {
      const next = !open;
      if (next) setFavoritesOpen(false);
      return next;
    });
  }, [navigate]);

  const value = useMemo(
    () => ({
      favoritesOpen,
      openFavorites,
      closeFavorites,
      toggleFavorites,
      nearbyOpen,
      openNearby,
      closeNearby,
      toggleNearby,
    }),
    [
      favoritesOpen,
      openFavorites,
      closeFavorites,
      toggleFavorites,
      nearbyOpen,
      openNearby,
      closeNearby,
      toggleNearby,
    ],
  );

  return (
    <MainTabContext.Provider value={value}>{children}</MainTabContext.Provider>
  );
}

export function useMainTab() {
  const ctx = useContext(MainTabContext);
  if (!ctx) {
    throw new Error('useMainTab must be used within MainTabProvider');
  }
  return ctx;
}
