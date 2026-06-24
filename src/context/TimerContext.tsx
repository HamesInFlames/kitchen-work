import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { newId } from '../db/database'

// Global timer service. Multiple concurrent timers (perfect for multi-component
// bakes) live in one Web Worker; this context surfaces them to the HUD and fires
// sound + vibration + notification when one finishes.

export interface ActiveTimer {
  id: string
  label: string
  remaining: number
  total: number
  endAt: number
}

export interface FinishedTimer {
  id: string
  label: string
  at: number
}

interface TimerContextValue {
  timers: ActiveTimer[]
  finished: FinishedTimer[]
  start: (label: string, seconds: number) => string
  cancel: (id: string) => void
  cancelAll: () => void
  addTime: (id: string, seconds: number) => void
  dismissFinished: (id: string) => void
  notificationPermission: NotificationPermission | 'unsupported'
  requestNotifications: () => Promise<void>
}

const TimerContext = createContext<TimerContextValue | null>(null)

type WorkerOut =
  | { type: 'tick'; timers: ActiveTimer[] }
  | { type: 'done'; id: string; label: string }

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<ActiveTimer[]>([])
  const [finished, setFinished] = useState<FinishedTimer[]>([])
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  const workerRef = useRef<Worker | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const msg = e.data
      if (msg.type === 'tick') {
        setTimers(msg.timers)
      } else if (msg.type === 'done') {
        ring(msg.label)
        setFinished((prev) => [{ id: msg.id, label: msg.label, at: Date.now() }, ...prev])
      }
    }
    workerRef.current = worker
    return () => {
      worker.terminate()
      workerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ensureAudio = useCallback((): AudioContext | null => {
    if (audioRef.current) return audioRef.current
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioRef.current = new Ctor()
    return audioRef.current
  }, [])

  const playChime = useCallback(() => {
    const ac = audioRef.current
    if (!ac) return
    if (ac.state === 'suspended') void ac.resume()
    const now = ac.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 1175 : 880
      osc.connect(gain)
      gain.connect(ac.destination)
      const t = now + i * 0.5
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      osc.start(t)
      osc.stop(t + 0.5)
    }
  }, [])

  const ring = useCallback(
    (label: string) => {
      playChime()
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 400])
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`${label} — time's up`, {
            body: 'Tap to return to the recipe.',
            tag: 'tova-timer',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          })
        }
      } catch {
        /* Notifications are unreliable in backgrounded iOS PWAs; the chime + HUD cover it. */
      }
    },
    [playChime],
  )

  const start = useCallback(
    (label: string, seconds: number): string => {
      // start() is always called from a user gesture, so this is a valid moment
      // to unlock audio and ask for notification permission.
      ensureAudio()
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default'
      ) {
        void Notification.requestPermission().then(setNotificationPermission)
      }
      const id = newId()
      workerRef.current?.postMessage({ type: 'start', id, label, seconds })
      return id
    },
    [ensureAudio],
  )

  const cancel = useCallback((id: string) => {
    workerRef.current?.postMessage({ type: 'cancel', id })
  }, [])

  const cancelAll = useCallback(() => {
    workerRef.current?.postMessage({ type: 'cancelAll' })
    setFinished([])
  }, [])

  const addTime = useCallback((id: string, seconds: number) => {
    workerRef.current?.postMessage({ type: 'addTime', id, seconds })
  }, [])

  const dismissFinished = useCallback((id: string) => {
    setFinished((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setNotificationPermission(result)
  }, [])

  const value = useMemo<TimerContextValue>(
    () => ({
      timers,
      finished,
      start,
      cancel,
      cancelAll,
      addTime,
      dismissFinished,
      notificationPermission,
      requestNotifications,
    }),
    [
      timers,
      finished,
      start,
      cancel,
      cancelAll,
      addTime,
      dismissFinished,
      notificationPermission,
      requestNotifications,
    ],
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimers(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimers must be used within a TimerProvider')
  return ctx
}
