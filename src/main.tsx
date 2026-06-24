import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyStoredTextScale } from './lib/textScale'

// Apply the saved text size before first paint to avoid a flash at the default.
applyStoredTextScale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
