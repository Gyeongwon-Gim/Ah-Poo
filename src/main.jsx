import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { syncBottomNavOffset } from './utils/bottomNavOffset.js'
import './index.css'

const syncViewport = () => syncBottomNavOffset()
syncViewport()
window.addEventListener('resize', syncViewport)
window.visualViewport?.addEventListener('resize', syncViewport)
window.visualViewport?.addEventListener('scroll', syncViewport)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)