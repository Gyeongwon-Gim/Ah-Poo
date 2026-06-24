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
// iOS PWA 콜드 런치 시 뷰포트(세이프에어리어/상태바)는 첫 페인트 직후 수백 ms에
// 걸쳐 정착하지만 resize 이벤트가 안 오는 경우가 있다. 정착 구간 동안 몇 차례
// 강제로 다시 측정해 --screen-h를 맞추고 screen-resize로 지도 relayout을 연쇄시킨다.
window.addEventListener('load', syncAppViewport);
window.addEventListener('pageshow', syncAppViewport);
requestAnimationFrame(syncAppViewport);
[100, 300, 600, 1000].forEach((ms) => window.setTimeout(syncAppViewport, ms));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
