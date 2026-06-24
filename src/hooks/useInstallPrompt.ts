import { useCallback, useEffect, useMemo, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Drives the install banner. On Chromium we capture `beforeinstallprompt` and
 * can trigger the native prompt. On iOS there is no such event, so we detect iOS
 * and surface the manual "Share → Add to Home Screen" instructions instead —
 * installing is mandatory there for data durability.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferred) return null
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    return choice.outcome
  }, [deferred])

  const isIOS = useMemo(
    () =>
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPadOS reports as Mac; detect via touch points.
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    [],
  )

  return { canInstall: !!deferred, promptInstall, installed, isIOS }
}
