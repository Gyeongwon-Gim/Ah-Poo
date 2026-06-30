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
}

const MainTabContext = createContext<MainTabContextValue | null>(null);

export function MainTabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const closeFavorites = useCallback(() => {
    setFavoritesOpen(false);
  }, []);

  const openFavorites = useCallback(() => {
    navigate('/');
    setFavoritesOpen(true);
  }, [navigate]);

  const toggleFavorites = useCallback(() => {
    navigate('/');
    setFavoritesOpen((open) => !open);
  }, [navigate]);

  const value = useMemo(
    () => ({
      favoritesOpen,
      openFavorites,
      closeFavorites,
      toggleFavorites,
    }),
    [favoritesOpen, openFavorites, closeFavorites, toggleFavorites],
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
