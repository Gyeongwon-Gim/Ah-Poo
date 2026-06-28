import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { MainTabProvider } from './contexts/MainTabContext';
import { FavoritesProvider } from './hooks/useFavorites';
// import FloatingNav from './components/FloatingNav';
import './components/FloatingNav.css';
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
                {/* <Route path="/pool" element={<PoolDetail />} /> */}
                {/* <Route path="/swimming-diary" element={<SwimmingDiary />} /> */}
              </Routes>
            </div>
            {/* <FloatingNav /> */}
          </div>
        </MainTabProvider>
      </FavoritesProvider>
    </Router>
  );
}

export default App;
