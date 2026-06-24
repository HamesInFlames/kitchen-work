import { useRef, type TouchEvent } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

/**
 * Horizontal swipe detection tuned for bake mode: a generous threshold so the
 * side of a wrist works, and a dominance check so vertical scrolling isn't
 * mistaken for a swipe.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers, threshold = 64) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY }
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const t = e.changedTouches[0]
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) onSwipeLeft?.()
        else onSwipeRight?.()
      }
    },
  }
}
