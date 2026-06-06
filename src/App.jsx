import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PoolDetail from './pages/PoolDetail';
import SwimmingDiary from './pages/SwimmingDiary';
import BottomNav from './components/BottomNav';
import { MainTabProvider } from './contexts/MainTabContext';
import { FavoritesProvider } from './hooks/useFavorites';
import './App.css';

function App() {
  return (
    <Router>
      <FavoritesProvider>
        <MainTabProvider>
          <div className="app">
            <BottomNav />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pool" element={<PoolDetail />} />
              <Route path="/swimming-diary" element={<SwimmingDiary />} />
            </Routes>
          </div>
        </MainTabProvider>
      </FavoritesProvider>
    </Router>
  );
}

export default App;
