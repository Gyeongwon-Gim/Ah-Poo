import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { syncAppViewport } from './utils/appViewport.js';
import './index.css';

syncAppViewport();
window.addEventListener('resize', syncAppViewport);
window.visualViewport?.addEventListener('resize', syncAppViewport);
window.visualViewport?.addEventListener('scroll', syncAppViewport);
window.addEventListener('app-viewport-sync-request', syncAppViewport);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
