import { useLayoutEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { MapPinNavActive, MapPinNavInactive } from './icons/MapPinNavIcons';
import { useMainTab } from '../contexts/MainTabContext';
import { syncBottomNavOffset } from '../utils/bottomNavOffset';
import './BottomNav.css';

const FAVORITE_ICON_COLOR = '#f59e0b';

function FavoriteNavIcon({ active }) {
  return (
    <Star
      className="bottom-nav__icon"
      size={20}
      strokeWidth={1.5}
      color={active ? FAVORITE_ICON_COLOR : undefined}
      fill={active ? FAVORITE_ICON_COLOR : 'none'}
      aria-hidden
    />
  );
}

function BottomNav() {
  const navRef = useRef(null);
  const { pathname } = useLocation();
  const { favoritesOpen, closeFavorites, toggleFavorites } = useMainTab();

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const update = () => syncBottomNavOffset();

    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [pathname]);

  if (pathname === '/pool') {
    return null;
  }

  const isHome = pathname === '/';
  const isFavoritesActive = isHome && favoritesOpen;

  return (
    <nav ref={navRef} className="bottom-nav" aria-label="메인 메뉴">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `bottom-nav__link ${isActive && !favoritesOpen ? 'bottom-nav__link--active' : ''}`
        }
        end
        onClick={closeFavorites}
      >
        {({ isActive }) => {
          const searchActive = isActive && !favoritesOpen;
          return (
            <>
              {searchActive ? (
                <MapPinNavActive className="bottom-nav__icon" />
              ) : (
                <MapPinNavInactive className="bottom-nav__icon" />
              )}
              <span className="bottom-nav__label">수영장 찾기</span>
            </>
          );
        }}
      </NavLink>
      <button
        type="button"
        className={`bottom-nav__link bottom-nav__button ${
          isFavoritesActive ? 'bottom-nav__link--active' : ''
        }`}
        aria-pressed={isFavoritesActive}
        onClick={toggleFavorites}
      >
        <FavoriteNavIcon active={isFavoritesActive} />
        <span className="bottom-nav__label">즐겨찾기</span>
      </button>
    </nav>
  );
}

export default BottomNav;
