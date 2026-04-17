/**
 * Entry React: StrictMode + mount App vào #root, nạp CSS legacy + index.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/legacy-site.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
