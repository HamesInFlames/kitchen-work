import { useEffect, useState } from 'react'
import { getPhotoUrl } from '../db/photos'

/** Resolve a stored photo id to a (cached) object URL for <img src>. */
export function usePhotoUrl(id?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (!id) {
      setUrl(null)
      return
    }
    getPhotoUrl(id).then((u) => {
      if (alive) setUrl(u)
    })
    return () => {
      alive = false
    }
  }, [id])

  return url
}
