import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyPwaSafeAreaInsets } from './utils/pwaSafeArea.js'
import './index.css'

applyPwaSafeAreaInsets()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)