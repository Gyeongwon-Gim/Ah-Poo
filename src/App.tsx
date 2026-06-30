import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PoolDetail from './pages/PoolDetail';
import { MainTabProvider } from './contexts/MainTabContext';
import { FavoritesProvider } from './hooks/useFavorites';
import './App.css';

function App() {
  return (
    <Router>
      <FavoritesProvider>
        <MainTabProvider>
          <div className="app">
            <div className="app__main">
              <Routes>
                <Route path="/" element={<Home />} />
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
