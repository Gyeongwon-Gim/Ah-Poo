import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

const MainTabContext = createContext(null);

export function MainTabProvider({ children }) {
  const navigate = useNavigate();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [floatingNavHidden, setFloatingNavHidden] = useState(false);

  const closeFavorites = useCallback(() => {
    setFavoritesOpen(false);
  }, []);

  const openFavorites = useCallback(() => {
    navigate('/');
    setFavoritesOpen(true);
  }, [navigate]);

  const toggleFavorites = useCallback(() => {
    navigate('/');
    setFavoritesOpen((open) => {
      if (open) {
        setFloatingNavHidden(false);
      }
      return !open;
    });
  }, [navigate]);

  const value = useMemo(
    () => ({
      favoritesOpen,
      floatingNavHidden,
      setFloatingNavHidden,
      openFavorites,
      closeFavorites,
      toggleFavorites,
    }),
    [
      favoritesOpen,
      floatingNavHidden,
      openFavorites,
      closeFavorites,
      toggleFavorites,
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
