import { useEffect, useState } from 'react'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { CameraIcon, CloseIcon } from './icons'

interface PhotoThumbProps {
  photoId: string
  alt: string
  caption?: string
  className?: string
  rounded?: string
}

/** A tappable photo thumbnail that expands to a full-screen lightbox. */
export function PhotoThumb({
  photoId,
  alt,
  caption,
  className = 'h-20 w-20',
  rounded = 'rounded-xl',
}: PhotoThumbProps) {
  const url = usePhotoUrl(photoId)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        className={`no-tap-highlight relative shrink-0 overflow-hidden border border-line bg-surface-2 ${rounded} ${className}`}
        aria-label={`View photo: ${alt}`}
      >
        {url ? (
          <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-faint">
            <CameraIcon size={22} />
          </span>
        )}
      </button>
      {open && url && (
        <Lightbox url={url} alt={alt} caption={caption} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function Lightbox({
  url,
  alt,
  caption,
  onClose,
}: {
  url: string
  alt: string
  caption?: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/92 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="min-tap absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-center rounded-full bg-white/10 text-white"
        aria-label="Close photo"
      >
        <CloseIcon />
      </button>
      <img
        src={url}
        alt={alt}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {caption && <p className="mt-3 max-w-md text-center text-sm text-white/80">{caption}</p>}
    </div>
  )
}
