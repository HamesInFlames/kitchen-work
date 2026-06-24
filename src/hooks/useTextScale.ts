import { useCallback, useState } from 'react'
import { getStoredScale, setStoredScale } from '../lib/textScale'

/** Reads/writes the persisted root font-size used to scale the whole UI. */
export function useTextScale() {
  const [px, setPx] = useState<number>(() => getStoredScale())
  const set = useCallback((next: number) => {
    setStoredScale(next)
    setPx(next)
  }, [])
  return { px, set }
}
