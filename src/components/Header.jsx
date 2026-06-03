import { Waves } from 'lucide-react';
import './Header.css';

function Header({ poolCount = 0, loading = false, variant = 'default' }) {
  return (
    <header
      className={`header ${variant === 'map' ? 'header--map' : ''}`}
    ></header>
  );
}

export default Header;
