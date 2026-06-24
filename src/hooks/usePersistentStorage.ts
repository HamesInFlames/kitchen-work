import { useEffect, useState } from 'react'

export type PersistState = 'unknown' | 'persisted' | 'best-effort' | 'unsupported'

/**
 * Ask the browser to keep our data through storage pressure. Critical on iOS:
 * script-created storage is wiped after 7 days of no interaction UNLESS the app
 * is installed to the home screen — installing remains mandatory regardless.
 */
export function usePersistentStorage(): PersistState {
  const [state, setState] = useState<PersistState>('unknown')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!navigator.storage?.persisted) {
        if (alive) setState('unsupported')
        return
      }
      const already = await navigator.storage.persisted()
      if (already) {
        if (alive) setState('persisted')
        return
      }
      const granted = navigator.storage.persist ? await navigator.storage.persist() : false
      if (alive) setState(granted ? 'persisted' : 'best-effort')
    })()
    return () => {
      alive = false
    }
  }, [])

  return state
}
