import { useEffect, useState } from 'react'

/**
 * Ambient background loop for the landing route.
 *
 * Rendered from HTML with HyperFrames (source archived at
 * docs/hyperframes/hero-loop.composition.html) and encoded seamless — the last
 * frame stops one frame short of the cycle, so the wrap is invisible.
 *
 * Mounted only after the browser goes idle. The static hero image paints first
 * and stays the LCP element; the video can never delay it. Skipped entirely
 * for reduced-motion, save-data, and 2G, where an ambient decoration is not
 * worth the bytes.
 */
export default function HeroLoop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    if (conn?.saveData) return
    if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    const handle = idle(() => setShow(true))

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(handle as number)
      else window.clearTimeout(handle as number)
    }
  }, [])

  if (!show) return null

  return (
    <video
      aria-hidden
      autoPlay
      loop
      muted
      playsInline
      poster={`${import.meta.env.BASE_URL}video/hero-poster.jpg`}
      className="absolute inset-0 -z-10 h-full w-full object-cover motion-safe:animate-[fade-in_600ms_ease-out]"
    >
      <source src={`${import.meta.env.BASE_URL}video/hero-loop.webm`} type="video/webm" />
      <source src={`${import.meta.env.BASE_URL}video/hero-loop.mp4`} type="video/mp4" />
    </video>
  )
}
