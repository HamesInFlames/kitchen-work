import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { ShareIcon, PlusIcon, CloseIcon, DownloadIcon } from './icons'

const DISMISS_KEY = 'tova-install-dismissed'

/**
 * Nudges the baker to install to the home screen. This isn't cosmetic: on iOS,
 * home-screen install is what keeps the recipe data from being deleted after 7
 * days of non-use, and what makes Wake Lock work (iOS/iPadOS 18.4+).
 */
export function InstallBanner() {
  const { canInstall, promptInstall, installed, isIOS } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  )

  if (installed || dismissed) return null
  if (!canInstall && !isIOS) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-gold">
          <DownloadIcon size={22} />
        </span>
        <div className="flex-1">
          <p className="font-recipe text-lg text-ink">Install the recipe book</p>
          <p className="mt-1 text-sm text-ink-soft">
            Add it to your home screen so it opens full-screen, works offline, keeps the screen
            awake while baking, and never loses your recipes.
          </p>

          {canInstall ? (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="mt-3 min-h-11 rounded-xl bg-gold px-4 font-semibold text-black"
            >
              Install app
            </button>
          ) : (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-ink">
              Tap
              <span className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-ink-soft">
                <ShareIcon size={15} /> Share
              </span>
              then
              <span className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-ink-soft">
                <PlusIcon size={15} /> Add to Home Screen
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-mr-2 -mt-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-faint hover:text-ink"
          aria-label="Dismiss install prompt"
        >
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  )
}
