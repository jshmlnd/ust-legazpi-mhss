import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { applyStartupTheme } from './lib/prefs.js'

// Restore the saved UI preferences before first paint.
applyStartupTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </StrictMode>,
)
