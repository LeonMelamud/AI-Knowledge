import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { heroFor, heroSrc } from '../lib/heroes'

const DURATION = 620

/**
 * Per-route transition sting.
 *
 * A panel carrying the incoming route's hero image sweeps once across the
 * viewport on navigation.
 *
 * NON-BLOCKING CONTRACT — this is a hard requirement, not an optimisation.
 * The overlay is `position: fixed` with `pointer-events: none`, rendered above
 * content that has *already mounted*. Route content renders and is interactive
 * for the entire time the sting plays. If the image is missing, still loading,
 * or fails to decode, nothing waits on it and the route behaves exactly as if
 * the sting did not exist. A sting must never gate navigation.
 */
export default function TransitionSting() {
  const location = useLocation()
  const [routeId, setRouteId] = useState<string | null>(null)
  const firstLoad = useRef(true)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Never play on arrival — only on navigation. Playing on first load would
    // put a decorative animation in front of first contentful paint.
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }

    const id = location.pathname.replace(/^\//, '')

    // Clear on the way out, never bail early while a sting is still mounted.
    // Returning without this leaves `routeId` pointing at the previous route,
    // and because the element is keyed on pathname React remounts it — replaying
    // the *old* route's hero across a page that has no hero (the legal pages),
    // then leaving it in the DOM with no timer to remove it.
    if (!shouldPlay() || !heroFor(id)?.available) {
      setRouteId(null)
      return
    }

    setRouteId(id)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRouteId(null), DURATION)

    return () => window.clearTimeout(timer.current)
  }, [location.pathname])

  if (!routeId) return null

  return (
    <div aria-hidden className="sting" key={location.pathname}>
      <img src={heroSrc(routeId, 1280, 'avif')} alt="" decoding="async" />
    </div>
  )
}

/**
 * Motion is a courtesy, not a feature. Skip it whenever the user or their
 * connection has signalled they would rather not pay for it.
 */
function shouldPlay(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (conn?.saveData) return false
  if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return false

  return true
}
