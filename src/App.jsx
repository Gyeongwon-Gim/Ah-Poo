import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PoolDetail from './pages/PoolDetail';
import SwimmingDiary from './pages/SwimmingDiary';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pool" element={<PoolDetail />} />
          <Route path="/swimming-diary" element={<SwimmingDiary />} />
        </Routes>
        {/* <BottomNav /> */}
      </div>
    </Router>
  );
}

export default App;
