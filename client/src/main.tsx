import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// legacy hash routes from the old site (ai-know.org/#/hot-news) → real paths
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

// A deploy replaces every hashed asset, so a tab opened before it 404s on the
// next dynamic import. Reload to pick up the new index. Pages caches index.html
// for 10 minutes, so a reload can land on the stale HTML again — the timestamp
// keeps that from looping and lets the import reject into the page's error UI.
const RELOAD_KEY = 'chunk-reload-at'
window.addEventListener('vite:preloadError', () => {
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
  if (Date.now() - lastReload < 60_000) return
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
