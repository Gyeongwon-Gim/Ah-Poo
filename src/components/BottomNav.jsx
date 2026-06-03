import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const { pathname } = useLocation();

  if (pathname === '/pool') {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="메인 메뉴">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
        }
        end
      >
        {/* <span className="bottom-nav__icon" aria-hidden>📍</span> */}
        <span className="bottom-nav__label">수영장 찾기</span>
      </NavLink>
      <NavLink
        to="/swimming-diary"
        className={({ isActive }) =>
          `bottom-nav__link ${isActive ? 'bottom-nav__link--active' : ''}`
        }
      >
        {/* <span className="bottom-nav__icon" aria-hidden>🏊</span> */}
        <span className="bottom-nav__label">운동 기록</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
