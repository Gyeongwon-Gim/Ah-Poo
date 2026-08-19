import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Explore from '@/pages/Explore/Explore';
import PoolDetail from '@/pages/PoolDetail/PoolDetail';
import { AuthProvider } from '@/contexts/AuthContext';
import { PoolFilterProvider } from '@/contexts/PoolFilterContext';
import { FavoritesProvider } from '@/hooks/useFavorites';
import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <FavoritesProvider>
          <PoolFilterProvider>
            <div className="app">
              <div className="app__main">
                <Routes>
                  <Route path="/" element={<Explore />} />
                  <Route path="/pool/:id" element={<PoolDetail />} />
                </Routes>
              </div>
            </div>
          </PoolFilterProvider>
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
