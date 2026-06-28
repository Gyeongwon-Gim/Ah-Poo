import { NavLink, useLocation } from 'react-router-dom';
import { MapPinNavActive, MapPinNavInactive } from './icons/MapPinNavIcons';
import { useMainTab } from '../contexts/MainTabContext';
import './FloatingNav.css';

function FloatingNav() {
  const { pathname } = useLocation();
  const { favoritesOpen, closeFavorites, floatingNavHidden } = useMainTab();

  if (pathname === '/pool') {
    return null;
  }

  return (
    <nav
      className={`floating-nav glassforge-glass${floatingNavHidden ? ' is-hidden' : ''}`}
      aria-label="메인 메뉴"
      aria-hidden={floatingNavHidden}
    >
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
    </nav>
  );
}

export default FloatingNav;
