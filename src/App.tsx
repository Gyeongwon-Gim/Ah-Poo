import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Explore from '@/pages/Explore/Explore';
import PoolDetail from '@/pages/PoolDetail/PoolDetail';
import { MainTabProvider } from '@/contexts/MainTabContext';
import { FavoritesProvider } from '@/hooks/useFavorites';
import './App.css';

function App() {
  return (
    <Router>
      <FavoritesProvider>
        <MainTabProvider>
          <div className="app">
            <div className="app__main">
              <Routes>
                <Route path="/" element={<Explore />} />
                <Route path="/pool/:id" element={<PoolDetail />} />
              </Routes>
            </div>
          </div>
        </MainTabProvider>
      </FavoritesProvider>
    </Router>
  );
}

export default App;
