import { useCallback, useEffect, useRef, useState } from 'react'
import NoSleep from 'nosleep.js'

// Keep the screen awake in bake mode — the #1 named in-kitchen annoyance.
// Prefers the standard Screen Wake Lock API; falls back to NoSleep.js for older
// iOS (Wake Lock only works in installed Home Screen PWAs from iOS/iPadOS 18.4).
// Re-acquires when the page becomes visible again *only after a prior success*,
// so an environment that denies the lock doesn't spin in a retry loop.

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const noSleepRef = useRef<NoSleep | null>(null)
  const onReleaseRef = useRef<(() => void) | null>(null)
  const wantRef = useRef(false)
  const acquiredEverRef = useRef(false)
  const [active, setActive] = useState(false)

  const detachSentinel = useCallback(() => {
    if (sentinelRef.current && onReleaseRef.current) {
      sentinelRef.current.removeEventListener('release', onReleaseRef.current)
    }
    onReleaseRef.current = null
  }, [])

  const acquire = useCallback(async () => {
    wantRef.current = true
    if ('wakeLock' in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        detachSentinel()
        sentinelRef.current = sentinel
        const onRelease = () => {
          detachSentinel()
          sentinelRef.current = null
          // OS released it (e.g. backgrounded). Reflect inactive only if we no
          // longer want it; the visibility handler re-acquires otherwise.
          if (!wantRef.current) setActive(false)
        }
        onReleaseRef.current = onRelease
        sentinel.addEventListener('release', onRelease)
        acquiredEverRef.current = true
        setActive(true)
        return
      } catch {
        /* fall through to NoSleep */
      }
    }
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep()
      await noSleepRef.current.enable()
      acquiredEverRef.current = true
      setActive(true)
    } catch {
      setActive(false)
    }
  }, [detachSentinel])

  const release = useCallback(async () => {
    wantRef.current = false
    detachSentinel()
    try {
      await sentinelRef.current?.release()
    } catch {
      /* ignore */
    }
    sentinelRef.current = null
    try {
      noSleepRef.current?.disable()
    } catch {
      /* ignore */
    }
    setActive(false)
  }, [detachSentinel])

  // Re-acquire on return to foreground (OS drops the lock when backgrounded),
  // but only if we previously held it — never spin retrying a denied request.
  useEffect(() => {
    const onVisible = () => {
      if (
        wantRef.current &&
        acquiredEverRef.current &&
        document.visibilityState === 'visible' &&
        !sentinelRef.current
      ) {
        void acquire()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [acquire])

  // Always release on unmount.
  useEffect(() => {
    return () => {
      void release()
    }
  }, [release])

  return { active, acquire, release }
}
