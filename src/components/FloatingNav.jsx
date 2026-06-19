import { Star } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { MapPinNavActive, MapPinNavInactive } from './icons/MapPinNavIcons';
import { useMainTab } from '../contexts/MainTabContext';
import './FloatingNav.css';

const FAVORITE_ICON_COLOR = '#ff9500';

function FavoriteNavIcon({ active }) {
  return (
    <Star
      className="floating-nav__icon"
      size={20}
      strokeWidth={1.5}
      color={active ? FAVORITE_ICON_COLOR : undefined}
      fill={active ? FAVORITE_ICON_COLOR : 'none'}
      aria-hidden
    />
  );
}

function FloatingNav() {
  const { pathname } = useLocation();
  const { favoritesOpen, closeFavorites, toggleFavorites, floatingNavHidden } =
    useMainTab();

  if (pathname === '/pool') {
    return null;
  }

  const isHome = pathname === '/';
  const isFavoritesActive = isHome && favoritesOpen;
  const activeIndex = isFavoritesActive ? 1 : 0;

  return (
    <nav
      className={`floating-nav glassforge-glass${floatingNavHidden ? ' is-hidden' : ''}`}
      aria-label="메인 메뉴"
      aria-hidden={floatingNavHidden}
      style={{ '--active-index': activeIndex }}
    >
      <div className="floating-nav__indicator" aria-hidden />
      <NavLink
        to="/"
        className="floating-nav__item"
        end
        onClick={closeFavorites}
      >
        {({ isActive }) => {
          const searchActive = isActive && !favoritesOpen;
          return (
            <>
              {searchActive ? (
                <MapPinNavActive className="floating-nav__icon" />
              ) : (
                <MapPinNavInactive className="floating-nav__icon" />
              )}
              <span className="floating-nav__label">수영장 찾기</span>
            </>
          );
        }}
      </NavLink>
      <button
        type="button"
        className="floating-nav__item floating-nav__button"
        aria-pressed={isFavoritesActive}
        onClick={toggleFavorites}
      >
        <FavoriteNavIcon active={isFavoritesActive} />
        <span className="floating-nav__label">즐겨찾기</span>
      </button>
    </nav>
  );
}

export default FloatingNav;
